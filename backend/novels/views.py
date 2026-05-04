import os
import uuid
import random
import logging
import json
import datetime
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.db import connection, transaction, models
from django.db.models import F, Sum
from django.http import JsonResponse
from rest_framework import viewsets, status, filters, permissions, response, views as drf_views
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .models import (
    Books, BookImages, Authors, Categories, Events, EventBooks, AddToCart, 
    Orders, OrderItems, Payments, Invoices, Users, Role, RolePermission,
    Coupon, UserCoupon, CouponUsage, UserOTP, Favorite
)
from .serializers import (
    BookSerializer, AuthorSerializer, CategorySerializer, 
    EventSerializer, CustomTokenObtainPairSerializer, AddToCartSerializer,
    OrderSerializer, OrderItemSerializer, PaymentSerializer, UserSerializer,
    RegisterSerializer,
    RoleSerializer, RolePermissionSerializer,
    CouponSerializer, UserCouponSerializer, CouponUsageSerializer, NotificationSerializer,
    FavoriteSerializer
)
from .permissions import HasGranularPermission
from .models import Notification

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    resource_name = 'notifications'

    def get_queryset(self):
        # Users only see their own notifications
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})


# --- DATABASE SCHEMA FIX ---
def ensure_user_schema():
    """Manually adds missing columns to 'users' table (since it's unmanaged)"""
    from django.db import connection
    with connection.cursor() as cursor:
        table_name = 'users'
        db_engine = settings.DATABASES['default']['ENGINE']
        
        # Helper to check and add column
        def add_column_if_missing(column_name, column_type):
            try:
                if 'sqlite' in db_engine:
                    cursor.execute(f"PRAGMA table_info({table_name})")
                    columns = [row[1] for row in cursor.fetchall()]
                    if column_name not in columns:
                        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
                else:
                    # MySQL/Postgres
                    cursor.execute(f"SHOW COLUMNS FROM {table_name} LIKE %s", [column_name])
                    if not cursor.fetchone():
                        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
            except Exception as e:
                print(f"Error adding {column_name}: {e}")

# Ensure required columns exist
        add_column_if_missing('created_at', 'DATETIME' if 'sqlite' in db_engine else 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        add_column_if_missing('failed_login_attempts', 'INTEGER DEFAULT 0')
        add_column_if_missing('locked_until', 'DATETIME NULL')
        add_column_if_missing('reward_points', 'INTEGER DEFAULT 0')

def ensure_books_schema():
    """Ensures edition_type column in 'books' table is long enough"""
    from django.db import connection
    with connection.cursor() as cursor:
        db_engine = settings.DATABASES['default']['ENGINE']
        try:
            if 'sqlite' in db_engine:
                # SQLite doesn't support easy ALTER COLUMN, but let's hope it's not needed for string length
                pass
            else:
                # MySQL/Postgres
                cursor.execute("ALTER TABLE books MODIFY COLUMN edition_type VARCHAR(100)")
                cursor.execute("ALTER TABLE books MODIFY COLUMN isbn VARCHAR(50) NULL")
        except Exception as e:
            print(f"Error updating books schema: {e}")

def ensure_events_schema():
    """Ensures banner_url column in 'events' table is long enough"""
    from django.db import connection
    with connection.cursor() as cursor:
        db_engine = settings.DATABASES['default']['ENGINE']
        try:
            if 'sqlite' in db_engine:
                pass
            else:
                cursor.execute("ALTER TABLE events MODIFY COLUMN banner_url VARCHAR(500)")
        except Exception as e:
            print(f"Error updating banner_url length: {e}")

# Run immediately when views are loaded
ensure_user_schema()
# ensure_books_schema()
# ensure_events_schema()

def health(request):
    return JsonResponse({"status": "ok"})


class BookViewSet(viewsets.ModelViewSet):
    queryset = Books.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    resource_name = 'books'
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'isbn', 'author__name', 'author__name_km', 'category__name', 'category__name_km', 'description']

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback
            return Response({
                "error": str(e),
                "traceback": traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Atomic increment to avoid race conditions
        Books.objects.filter(id=instance.id).update(views_count=F('views_count') + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def best_sellers(self, request):
        """Dynamic Top 5 Best Sellers based on actual sales volume."""
        from django.db.models import Sum
        import random
        
        # 1. Get Top 10 books based on total quantity sold
        top_books_ids = OrderItems.objects.values('book')\
            .annotate(total_sold=Sum('quantity'))\
            .order_by('-total_sold')[:10]
        
        ids = [item['book'] for item in top_books_ids]
        
        if not ids:
            # Fallback to Top 5 by views if no sales yet
            queryset = Books.objects.all().order_by('-views_count')[:5]
        else:
            # 2. Fetch the books
            top_books_queryset = Books.objects.filter(id__in=ids)
            
            # 3. Dynamic Random Top 5 from the Top 10
            all_top_books = list(top_books_queryset)
            if len(all_top_books) > 5:
                random_top_5 = random.sample(all_top_books, 5)
            else:
                random_top_5 = all_top_books
            
            queryset = random_top_5

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        queryset = Books.objects.all()
        
        # Filter by category (ID or Slug)
        category_param = self.request.query_params.get('category')
        if category_param:
            if str(category_param).isdigit():
                queryset = queryset.filter(category_id=category_param)
            else:
                queryset = queryset.filter(category__slug=category_param)
            
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
            
        # Filter by author
        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(author_id=author_id)
            
        # Filter by edition type
        edition_type = self.request.query_params.get('edition_type')
        if edition_type:
            queryset = queryset.filter(edition_type__icontains=edition_type)
            
        # Filter by discount status
        has_discount = self.request.query_params.get('has_discount') or self.request.query_params.get('on_sale')
        if has_discount == 'true':
            from django.utils import timezone
            now = timezone.now()
            # Find books that have an active event associated with them via EventBooks
            queryset = queryset.filter(
                event_books__event__status='Active',
                event_books__event__start_date__lte=now,
                event_books__event__end_date__gte=now
            ).distinct()
            
        # Support ordering
        ordering = self.request.query_params.get('ordering')
        if ordering:
            queryset = queryset.order_by(ordering)
            
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            # 1. Extract non-image data
            book_data = {
                'title': request.data.get('title'),
                'price': request.data.get('price'),
                'price_riel': request.data.get('price_riel'),
                'isbn': request.data.get('isbn'),
                'stock_qty': request.data.get('stock_qty'),
                'description': request.data.get('description'),
                'category': request.data.get('category') or None, 
                'author': request.data.get('author') or None,
                'edition_type': request.data.get('edition_type'),
                'is_active': request.data.get('is_active', 1),
            }

            # 2. Create the Book
            serializer = self.get_serializer(data=book_data)
            serializer.is_valid(raise_exception=True)
            book = serializer.save()

            # 3. Handle Images
            print(f"DEBUG FILES KEYS: {list(request.FILES.keys())}")
            print(f"DEBUG DATA KEYS: {list(request.data.keys())}")
            images = request.FILES.getlist('images')
            main_image_idx = int(request.data.get('main_image_idx', 0))

            if images:
                for idx, image_file in enumerate(images):
                    # Simply create the record and assign the file object.
                    # Django's ImageField will handle the S3 upload automatically.
                    BookImages.objects.create(
                        book=book,
                        image_url=image_file,
                        is_main=1 if idx == main_image_idx else 0
                    )

            # 4. Handle Event Association
            event_id = request.data.get('event_id')
            if event_id and event_id != "" and event_id != "null":
                # Use ORM now that EventBooks is managed
                from .models import EventBooks
                flash_sale_qty = request.data.get('flash_sale_qty', 0)
                items_sold = request.data.get('items_sold', 0)
                
                EventBooks.objects.update_or_create(
                    book=book,
                    defaults={
                        'event_id': event_id, 
                        'flash_sale_qty': flash_sale_qty if flash_sale_qty != "" else 0, 
                        'items_sold': items_sold if items_sold != "" else 0
                    }
                )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"DEBUG ERROR: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # 1. Prepare and clean data for serializer
        data = request.data.copy()
        
        # Ensure FK fields are not empty strings
        for field in ['category', 'author']:
            if field in data and (data[field] == "" or data[field] == "null"):
                data[field] = None

        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # 2. Sync Existing Images
        existing_images_raw = request.data.get('existing_images')
        if existing_images_raw:
            try:
                if isinstance(existing_images_raw, str):
                    existing_images_ids = json.loads(existing_images_raw)
                else:
                    existing_images_ids = existing_images_raw
                
                if isinstance(existing_images_ids, list):
                    BookImages.objects.filter(book=instance).exclude(id__in=existing_images_ids).delete()
            except Exception as e:
                print(f"DEBUG SYNC ERROR: {str(e)}")

        # 3. Add New Images
        images = request.FILES.getlist('images')
        if images:
            for image_file in images:
                BookImages.objects.create(
                    book=instance,
                    image_url=image_file,
                    is_main=0
                )

        # 4. Update Main Image Status
        main_image_idx_raw = request.data.get('main_image_idx')
        if main_image_idx_raw is not None and str(main_image_idx_raw) != "":
            try:
                main_image_idx = int(main_image_idx_raw)
                # Reset all current images to not-main
                BookImages.objects.filter(book=instance).update(is_main=0)
                
                # Fetch all current images for this book (existing + newly added)
                # We sort them by ID to maintain a consistent order
                all_images = list(BookImages.objects.filter(book=instance).order_by('id'))
                
                # Set the selected one to main based on the index provided by frontend
                if 0 <= main_image_idx < len(all_images):
                    target_img = all_images[main_image_idx]
                    target_img.is_main = 1
                    target_img.save()
            except (ValueError, TypeError) as e:
                print(f"DEBUG MAIN IMAGE ERROR: {str(e)}")

        # 5. Handle Event Association
        if 'event_id' in data:
            event_id = data.get('event_id')
            try:
                from .models import EventBooks
                if event_id and event_id != "" and str(event_id) != "null":
                    flash_sale_qty = data.get('flash_sale_qty')
                    items_sold = data.get('items_sold')
                    
                    defaults = {'event_id': event_id}
                    if flash_sale_qty is not None: defaults['flash_sale_qty'] = flash_sale_qty
                    if items_sold is not None: defaults['items_sold'] = items_sold
                    
                    # Use update_or_create to manage the link efficiently
                    EventBooks.objects.update_or_create(
                        book=instance,
                        defaults=defaults
                    )
                else:
                    # If event_id is empty/null, remove the association
                    EventBooks.objects.filter(book=instance).delete()
            except Exception as e:
                print(f"DEBUG EVENT ERROR: {str(e)}")

        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        # Redirect PUT to partial_update for simplicity
        return self.partial_update(request, *args, **kwargs)



class AuthorViewSet(viewsets.ModelViewSet):
    queryset = Authors.objects.all()
    serializer_class = AuthorSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    resource_name = 'authors'
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'name_km', 'biography']

    def create(self, request, *args, **kwargs):
        # 1. Extract non-image data
        author_data = {
            'name': request.data.get('name'),
            'biography': request.data.get('biography'),
        }

        # 2. Create the Author
        serializer = self.get_serializer(data=author_data)
        serializer.is_valid(raise_exception=True)
        author = serializer.save()

        # 3. Handle Photo
        photo_file = request.FILES.get('photo')
        if photo_file:
            # Assign the file object directly to trigger S3 storage upload
            author.photo_url = photo_file
            author.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            # 1. Update text data (Remove photo_url from data to avoid validation issues)
            data = request.data.copy()
            if 'photo_url' in data:
                del data['photo_url']
                
            serializer = self.get_serializer(instance, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)

            # 2. Handle Photo update
            # Check both 'photo' and 'photo_url' keys from FILES
            photo_file = request.FILES.get('photo') or request.FILES.get('photo_url')
            if photo_file:
                instance.photo_url = photo_file
                instance.save()

            return Response(serializer.data)
        except Exception as e:
            import traceback
            error_msg = f"ERROR: {str(e)}\n{traceback.format_exc()}"
            with open('/tmp/django_error.log', 'w') as f:
                f.write(error_msg)
            print(error_msg)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Categories.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    resource_name = 'categories'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'name_km']

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback
            return Response({
                "error": str(e),
                "traceback": traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Events.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    resource_name = 'events'
    filter_backends = [filters.SearchFilter]
    search_fields = ['title']



class AddToCartViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    resource_name = 'cart'
    serializer_class = AddToCartSerializer
    
    serializer_class = AddToCartSerializer

    def get_queryset(self):
        try:
            user = self.request.user
            user_role = str(user.role.name if user.role else "").lower()
            
            # Base queryset with optimizations
            queryset = AddToCart.objects.select_related('book', 'book__author', 'book__category', 'user')\
                .prefetch_related('book__bookimages_set')
            
            # If Admin, show all entries. If not, show only user's own entries.
            if user_role != 'admin':
                queryset = queryset.filter(user=user)
                
            return queryset.order_by('-created_at')
        except Exception as e:
            import traceback
            with open('debug_cart_error.log', 'a', encoding='utf-8') as f:
                f.write(f"GET_QUERYSET ERROR: {str(e)}\n{traceback.format_exc()}\n")
            raise e

    def create(self, request, *args, **kwargs):
        # 1. Handle "Repeater" format: items = [{"book": id, "quantity": qty}, ...]
        items = request.data.get('items', [])
        
        # 2. Handle "Multi-select" fallback: books = [id1, id2, ...], quantity = qty
        if not items:
            books_ids = request.data.get('books', [])
            quantity = request.data.get('quantity', 1)
            
            if not books_ids and 'book' in request.data:
                books_ids = [request.data.get('book')]
            
            if books_ids:
                items = [{"book": bid, "quantity": quantity} for bid in books_ids]

        if not items:
            return Response({"error": "No items selected"}, status=status.HTTP_400_BAD_REQUEST)

        # Generate a deterministic batch_id for the user today
        # Format: daily_batch_{user_id}_{YYYYMMDD}
        from django.utils import timezone
        today_str = timezone.now().strftime('%Y%m%d')
        batch_id = f"daily_{request.user.id}_{today_str}"
        
        created_entries = []
        for item in items:
            book_id = item.get('book')
            quantity = item.get('quantity', 1)
            if not book_id: continue
            
            # Stock check (Just verification, no deduction)
            try:
                book = Books.objects.get(id=book_id)
                if book.stock_qty is not None and quantity > book.stock_qty:
                    return Response(
                        {"error": f"Insufficient stock for '{book.title}'. Available: {book.stock_qty}"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Books.DoesNotExist:
                continue

            # Create or update entry
            entry, created = AddToCart.objects.get_or_create(
                user=request.user, 
                book_id=book_id, 
                batch_id=batch_id,
                defaults={'quantity': quantity}
            )
            if not created:
                entry.quantity += quantity
                entry.save()
                
            created_entries.append(AddToCartSerializer(entry).data)

        return Response(created_entries, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        """No stock restoration needed as no stock was deducted at cart stage."""
        return super().destroy(request, *args, **kwargs)


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [HasGranularPermission]
    resource_name = 'orders'
    serializer_class = OrderSerializer
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    filter_backends = [filters.SearchFilter]
    search_fields = ['id', 'user__email', 'user__full_name', 'status', 'shipping_address']

    def get_queryset(self):
        user_role = str(self.request.user.role or "").lower()
        base_qs = Orders.objects.all().select_related('payment', 'invoice', 'user').prefetch_related('items__book')
        
        if user_role == 'admin':
            return base_qs.order_by('-order_date')
        return base_qs.filter(user=self.request.user).order_by('-order_date')

    def create(self, request, *args, **kwargs):
        return self.checkout(request)

    @action(detail=True, methods=['post'])
    def confirm_payment(self, request, pk=None):
        """Action to mark an order and its payment as completed."""
        # HasGranularPermission handles confirmation check via action mapping (can_edit)
        
        from django.utils import timezone
        from django.db import transaction
        try:
            with transaction.atomic():
                order = self.get_object()
                order.status = 'Completed'
                order.save()
                
                # 1. Update Payment
                if hasattr(order, 'payment'):
                    payment = order.payment
                    payment.payment_status = 'Completed'
                    payment.payment_date = timezone.now()
                    
                    # Handle manual receipt upload
                    receipt_file = request.FILES.get('receipt_image')
                    if receipt_file:
                        payment.receipt_image = receipt_file
                        payment.payment_method = 'Manual Transfer'
                        
                    payment.save()
                else:
                    raise Exception("Payment record missing for this order.")

                # 2. Update Flash Sale 'items_sold' tracking
                from .models import EventBooks
                for item in order.items.all():
                    # Check if this book is part of an active Flash Sale event
                    active_flash_sale = EventBooks.objects.filter(
                        book=item.book,
                        event__event_type='FlashSale',
                        event__status='Active'
                    ).first()
                    
                    if active_flash_sale:
                        # Increment items_sold
                        active_flash_sale.items_sold += item.quantity
                        active_flash_sale.save()

                # 3. Generate Invoice
                invoice_no = f"INV-{timezone.now().strftime('%Y%m%d')}-{order.id:04d}"
                Invoices.objects.create(
                    invoice_no=invoice_no,
                    order=order,
                    customer_name=order.user.full_name or order.user.email,
                    billing_address=order.shipping_address,
                    subtotal=order.total_amount, # Simplifying: subtotal = total for now
                    total_amount=order.total_amount
                )
                
                # 4. Clear cart items associated with this order's batch
                if order.batch_id:
                    AddToCart.objects.filter(user=order.user, batch_id=order.batch_id).delete()
                
                return Response(OrderSerializer(order).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancel_order(self, request, pk=None):
        """Action to cancel an order and restore stock."""
        try:
            order = self.get_object()
            
            # Authorization: Admin or the person who placed the order
            user_role = str(request.user.role or "").lower()
            if user_role != 'admin' and order.user != request.user:
                return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
                
            if order.status == 'Cancelled':
                return Response({"error": "Order is already cancelled"}, status=status.HTTP_400_BAD_REQUEST)
                
            from django.db import transaction
            with transaction.atomic():
                # Only restore stock if it was actually deducted
                # Deducted if: (not ABA) OR (is ABA AND payment is already Completed)
                was_deducted = False
                if hasattr(order, 'payment'):
                    if order.payment.payment_method != "ABA Bank" or order.payment.payment_status == "Completed":
                        was_deducted = True
                
                order.status = 'Cancelled'
                order.save()
                
                if was_deducted:
                    # Restore Stock
                    for item in order.items.all():
                        book = item.book
                        if book.stock_qty is not None:
                            book.stock_qty += item.quantity
                            book.save()
                        
                # Update payment status
                if hasattr(order, 'payment'):
                    # Only change if not already completed
                    if order.payment.payment_status != 'Completed':
                        order.payment.payment_status = 'Failed'
                    order.payment.save()
                    
            return Response(OrderSerializer(order).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Admin statistics for the dashboard."""
        # HasGranularPermission handles stats check via action mapping (can_view)
            
        from django.db.models import Sum, Count
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.now().date()
        
        total_revenue = Orders.objects.filter(status__in=['Completed', 'Processing']).aggregate(total=Sum('total_amount'))['total'] or 0
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_revenue = Orders.objects.filter(status__in=['Completed', 'Processing'], order_date__gte=today_start).aggregate(total=Sum('total_amount'))['total'] or 0
        pending_orders = Orders.objects.filter(status='Pending').count()
        
        # 4. Invoice specific stats
        total_invoices = Invoices.objects.count()
        invoiced_revenue = Invoices.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        
        # 5. Customer stats
        total_customers = Users.objects.exclude(role__name__iexact='Admin').count()
        
        # 6. Calculate Dynamic Growth (Last 7 days vs Previous 7 days)
        revenue_growth = self._calculate_growth(Orders.objects.filter(status__in=['Completed', 'Processing']), 'order_date', 'total_amount')
        invoice_growth = self._calculate_growth(Invoices.objects.all(), 'created_at')
        customer_growth = self._calculate_growth(Users.objects.exclude(role__name__iexact='Admin'), 'created_at')
        unpaid_growth = self._calculate_growth(Orders.objects.filter(status='Pending'), 'order_date')

        # 7. Chart Data: Invoice Stats (Paid, Overdue, Unpaid)
        seven_days_ago = timezone.now() - timedelta(days=7)
        paid_count = Orders.objects.filter(status__in=['Completed', 'Processing']).count()
        overdue_count = Orders.objects.filter(status='Pending', order_date__lt=seven_days_ago).count()
        unpaid_count = Orders.objects.filter(status='Pending', order_date__gte=seven_days_ago).count()
        
        invoice_chart = [
            {"name": "Total Paid", "value": paid_count, "color": "#1e293b"},
            {"name": "Total Overdue", "value": overdue_count, "color": "#3b82f6"},
            {"name": "Total Unpaid", "value": unpaid_count, "color": "#f1f5f9"}
        ]

        # 8. Chart Data: Monthly Sales (Last 6 Months)
        # Fetch completed orders from the last 6 months to group in Python
        # (Avoids TruncMonth which requires timezone tables in MySQL)
        six_months_ago = timezone.now() - timedelta(days=180)
        recent_orders = Orders.objects.filter(status__in=['Completed', 'Processing'], order_date__gte=six_months_ago)
        
        # Initialize final_sales_chart with last 6 months properly
        final_sales_chart = []
        now = timezone.now()
        for i in range(5, -1, -1):
            # Calculate month and year correctly
            year = now.year
            month = now.month - i
            while month <= 0:
                month += 12
                year -= 1
            
            month_date = datetime.date(year, month, 1)
            final_sales_chart.append({
                "month": month_date.strftime('%b'),
                "year": year,
                "month_int": month,
                "amount": 0.0
            })
            
        # Group and sum in Python
        for order in recent_orders:
            o_date = order.order_date
            for entry in final_sales_chart:
                if entry["month_int"] == o_date.month and entry["year"] == o_date.year:
                    entry["amount"] += float(order.total_amount)
                    break

        if False:
            months_data = []
        current_month_start = now.replace(day=1)
        
        # We'll collect the month names for the last 6 months
        check_date = current_month_start
        target_months = []
        for _ in range(6):
            target_months.insert(0, check_date.strftime('%b'))
            # Move to previous month
            check_date = (check_date - timedelta(days=1)).replace(day=1)
        
        # Query sales for those months
        six_months_ago_limit = check_date # This is now 6 months ago
        
        # monthly_sales = Orders.objects.filter(status='Completed', order_date__gte=six_months_ago_limit) \
        #    .annotate(month_date=TruncMonth('order_date')) \
        #    .values('month_date') \
        #    .annotate(amount=Sum('total_amount')) \
        #    .order_by('month_date')

        # Create a lookup for quick access
        # sales_data_map = {entry['month_date'].strftime('%b'): float(entry['amount']) for entry in monthly_sales}
        
        # Populate sales_chart in correct chronological order
        # for m_name in target_months:
        #    sales_chart.append({
        #        "month": m_name,
        #        "amount": sales_data_map.get(m_name, 0.0)
        #    })

        return Response({
            "total_revenue": total_revenue,
            "today_revenue": today_revenue,
            "pending_orders": pending_orders,
            "total_invoices": total_invoices,
            "invoiced_revenue": invoiced_revenue,
            "total_customers": total_customers,
            "revenue_growth": revenue_growth,
            "invoice_growth": invoice_growth,
            "customer_growth": customer_growth,
            "unpaid_growth": unpaid_growth,
            "invoice_chart": invoice_chart,
            "sales_chart": final_sales_chart,
            "payment_methods": list(Payments.objects.values('payment_method').annotate(count=Count('id')))
        })

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """
        Converts a 'batch_id' from AddToCart into a real Order.
        Expected Body: { 
            "batch_id": "...", 
            "shipping_address": "...", 
            "shipping_method": "...",
            "payment_method": "...",
            "user_coupon_id": null,
            "percentage_to_use": 0,
            "notes": "..."
        }
        """
        batch_id = request.data.get('batch_id')
        shipping_address = request.data.get('shipping_address')
        shipping_method = request.data.get('shipping_method', 'Pick Up')
        payment_method = request.data.get('payment_method', 'Cash')
        user_coupon_id = request.data.get('user_coupon_id')
        percentage_to_use = Decimal(str(request.data.get('percentage_to_use', 0)))
        notes = request.data.get('notes', '')
        
        if not batch_id or not shipping_address:
            return Response({"error": "batch_id and shipping_address are required"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Fetch cart items for this batch
        cart_items = AddToCart.objects.filter(user=request.user, batch_id=batch_id)
        if not cart_items.exists():
            return Response({"error": "No items found for this batch"}, status=status.HTTP_404_NOT_FOUND)

        from django.db import transaction
        try:
            with transaction.atomic():
                # 2. Calculate Total & Verify Stock
                total_amount = 0
                items_to_create = []
                
                for item in cart_items:
                    book = item.book
                    # Stock Check
                    if book.stock_qty is not None and item.quantity > book.stock_qty:
                        raise Exception(f"Insufficient stock for '{book.title}'. Only {book.stock_qty} available.")
                    
                    # Calculate price (using discounted price if applicable)
                    # We can use the serializer's method logic here or just calculate manually
                    price_at_purchase = self._get_book_price(book)
                    total_amount += price_at_purchase * item.quantity
                    
                    items_to_create.append({
                        'book': book,
                        'quantity': item.quantity,
                        'price_at_purchase': price_at_purchase
                    })

                # 2.5 Handle Coupon Discount
                discount_amount = Decimal('0.00')
                user_coupon = None
                if user_coupon_id and percentage_to_use > 0:
                    try:
                        user_coupon = UserCoupon.objects.get(id=user_coupon_id, user=request.user, is_used_up=False)
                        
                        # Validate percentage
                        if percentage_to_use > user_coupon.remaining_percentage:
                             raise Exception(f"Invalid percentage. You only have {user_coupon.remaining_percentage}% left.")
                        
                        # Calculate discount
                        discount_amount = (total_amount * percentage_to_use) / Decimal('100.0')
                        total_amount -= discount_amount
                    except UserCoupon.DoesNotExist:
                        raise Exception("Selected coupon is invalid or already used up.")

                # 3. Create Order
                order = Orders.objects.create(
                    user=request.user,
                    total_amount=total_amount,
                    shipping_address=shipping_address,
                    shipping_method=shipping_method,
                    notes=notes,
                    status='Pending',
                    batch_id=batch_id # Save batch_id to clear later
                )

                # 4. Create Order Items & Deduct Stock if not ABA (Cash/Manual)
                for item_data in items_to_create:
                    OrderItems.objects.create(
                        order=order,
                        book=item_data['book'],
                        quantity=item_data['quantity'],
                        price_at_purchase=item_data['price_at_purchase']
                    )
                    
                    # Deduct stock immediately ONLY for non-ABA payments (like Cash)
                    # For ABA, we deduct ONLY after payment success in callback.
                    if payment_method != "ABA Bank" and item_data['book'].stock_qty is not None:
                        item_data['book'].stock_qty -= item_data['quantity']
                        item_data['book'].save()

                # 5. Create Payment Record
                transaction_id = request.data.get('transaction_id')
                # Ensure empty string is saved as NULL to avoid unique constraint issues
                if not transaction_id or str(transaction_id).strip() == "":
                    transaction_id = None

                Payments.objects.create(
                    order=order,
                    payment_method=payment_method,
                    amount=total_amount,
                    payment_status='Pending',
                    transaction_id=transaction_id
                )

                # 5.5 Update Coupon Balance & Usage
                if user_coupon:
                    # Update balance first
                    user_coupon.remaining_percentage -= percentage_to_use
                    if user_coupon.remaining_percentage <= 0:
                        user_coupon.is_used_up = True
                    user_coupon.save()

                    # Record usage (now safe because deletion is deferred to on_commit)
                    CouponUsage.objects.create(
                        user_coupon=user_coupon,
                        coupon_code=user_coupon.coupon_code,
                        order=order,
                        percentage_used=percentage_to_use,
                        amount_saved=discount_amount
                    )

                # 6. Add Reward Points (1 point per item quantity)
                from django.db.models import F
                total_qty = sum(item_data['quantity'] for item_data in items_to_create)
                
                # Atomically increment reward points to avoid race conditions and ensure persistence
                Users.objects.filter(id=request.user.id).update(reward_points=F('reward_points') + total_qty)
                
                # Refresh the user instance in memory
                request.user.refresh_from_db()

                # 6.5 Send Notification
                Notification.objects.create(
                    user=request.user,
                    title="អ្នកទទួលបានពិន្ទុសន្សំថ្មី",
                    message=f"សូមអបអរសាទរ! អ្នកទទួលបាន {total_qty} ពិន្ទុពីការបញ្ជាទិញនេះ។",
                    type="success"
                )

                # 7. Clear Cart Batch
                cart_items.delete()

                return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def _get_book_price(self, book):
        """Helper to get current effective price of a book"""
        # We'll use the same logic as the serializer: find active event discount
        from .serializers import BookSerializer
        # We can reuse the serializer logic by instantiating it
        ser = BookSerializer(book)
        return ser.data.get('discounted_price', book.price)

    def _calculate_growth(self, queryset, date_field, amount_field=None):
        """Helper to calculate percentage growth between this week and last week"""
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Sum

        now = timezone.now()
        this_week_start = now - timedelta(days=7)
        last_week_start = now - timedelta(days=14)

        # Current period (Last 7 days)
        current_q = queryset.filter(**{f"{date_field}__gte": this_week_start})
        if amount_field:
            current_val = current_q.aggregate(total=Sum(amount_field))['total'] or 0
        else:
            current_val = current_q.count()

        # Previous period (Previous 7 days)
        last_q = queryset.filter(**{
            f"{date_field}__gte": last_week_start,
            f"{date_field}__lt": this_week_start
        })
        if amount_field:
            last_val = last_q.aggregate(total=Sum(amount_field))['total'] or 0
        else:
            last_val = last_q.count()

        if last_val == 0:
            # If nothing last week, and we have items this week, it's 100% growth
            # Otherwise if both 0, it's 0% growth
            return 100.0 if current_val > 0 else 0.0
        
        growth = ((float(current_val) - float(last_val)) / float(last_val)) * 100
        return round(growth, 1)


class UserViewSet(viewsets.ModelViewSet):
    queryset = Users.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [HasGranularPermission]
    resource_name = 'users'
    filter_backends = [filters.SearchFilter]
    search_fields = ['email', 'full_name', 'phone', 'role']

    def get_queryset(self):
        # Admins can see all users, others can only see themselves (though this is for dashboard mgmt)
        user_role = str(self.request.user.role.name if self.request.user.role else "").lower()
        if user_role == 'admin':
            return Users.objects.all().order_by('-created_at')
        return Users.objects.filter(id=self.request.user.id)

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        if request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='spin-wheel')
    def spin_wheel(self, request):
        """Handle the points deduction and determine a random win from the Lucky Wheel."""
        from django.db import transaction
        from django.db.models import F
        from django.db.models.functions import Coalesce
        import random
        
        user = request.user
        cost = 10
        
        # Ensure reward_points is not NULL for calculations
        if user.reward_points is None:
            user.reward_points = 0
            user.save(update_fields=['reward_points'])
            
        if user.reward_points < cost:
            return Response({"error": "អ្នកត្រូវការយ៉ាងតិច ១០ ពិន្ទុ ដើម្បីបង្វិលកង់នាំសំណាង"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Define the rewards on the backend to prevent cheating
        rewards_list = [
            {"label": "៥ ពិន្ទុ", "win_points": 5},
            {"label": "១០ ពិន្ទុ", "win_points": 10},
            {"label": "២០ ពិន្ទុ", "win_points": 20},
            {"label": "៣០ ពិន្ទុ", "win_points": 30},
            {"label": "Coupon ១០០០០៛", "win_points": 0},
            {"label": "សៀវភៅមួយក្បាល", "win_points": 0},
        ]
        
        # Pick a random reward
        winning_reward = random.choice(rewards_list)
        reward_label = winning_reward["label"]
        win_points = winning_reward["win_points"]
        
        try:
            with transaction.atomic():
                # Update points atomically: Deduct cost, add win_points. Use Coalesce to handle NULL just in case
                net_change = win_points - cost
                Users.objects.filter(id=user.id).update(
                    reward_points=Coalesce(F('reward_points'), 0) + net_change
                )
                
                # Refresh user instance
                user.refresh_from_db()
                
                # Send Notification
                title = "ការបង្វិលកង់នាំសំណាង"
                if win_points > 0:
                    message = f"អបអរសាទរ! អ្នកបានឈ្នះ {win_points} ពិន្ទុ បន្ទាប់ពីចំណាយ {cost} ពិន្ទុក្នុងការបង្វិល។"
                else:
                    message = f"អ្នកបានចំណាយ {cost} ពិន្ទុក្នុងការបង្វិលកង់នាំសំណាង និងទទួលបាន '{reward_label}'។"
                
                Notification.objects.create(
                    user=user,
                    title=title,
                    message=message,
                    type="success" if win_points > 0 else "info"
                )
                
                return Response({
                    "status": "success",
                    "reward_label": reward_label,
                    "reward_points": user.reward_points,
                    "win_points": win_points,
                    "cost": cost,
                    "message": message
                })
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [HasGranularPermission]
    resource_name = 'roles'

    @action(detail=True, methods=['post'], url_path='update-permissions')
    def update_permissions(self, request, pk=None):
        role = self.get_object()
        permissions_data = request.data.get('permissions', [])
        
        # Format can be: [{"resource": "books", "can_view": true, ...}]
        with connection.cursor() as cursor:
            for perm in permissions_data:
                resource = perm.get('resource')
                if not resource: continue
                
                RolePermission.objects.update_or_create(
                    role=role,
                    resource=resource,
                    defaults={
                        'can_view': perm.get('can_view', False),
                        'can_create': perm.get('can_create', False),
                        'can_edit': perm.get('can_edit', False),
                        'can_delete': perm.get('can_delete', False),
                    }
                )
        
        return Response(RoleSerializer(role).data)


class LoginView(TokenObtainPairView):
    """
    Takes credentials (email/password) and returns access and refresh tokens.
    """
    serializer_class = CustomTokenObtainPairSerializer


class GoogleLoginView(APIView):
    """
    Endpoint to verify Google ID token and return JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('id_token') or request.data.get('access_token')
        if not token:
            return Response({"error": "ID token or access token is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            email = None
            full_name = ""

            # Try to verify as ID Token first
            try:
                idinfo = id_token.verify_oauth2_token(token, google_requests.Request())
                email = idinfo.get('email')
                full_name = idinfo.get('name', '')
            except Exception:
                # Fallback: Try as Access Token by calling Google UserInfo API
                import requests as py_requests
                userinfo_response = py_requests.get(f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={token}")
                if userinfo_response.status_code == 200:
                    idinfo = userinfo_response.json()
                    email = idinfo.get('email')
                    full_name = idinfo.get('name', '')
                else:
                    return Response({"error": "Invalid token. Could not verify as ID token or access token."}, status=status.HTTP_400_BAD_REQUEST)

            if not email:
                return Response({"error": "Email not found in Google account info"}, status=status.HTTP_400_BAD_REQUEST)
                
            full_name = idinfo.get('name', '')
            picture = idinfo.get('picture', '')

            if not email:
                return Response({"error": "Email not found in Google account info"}, status=status.HTTP_400_BAD_REQUEST)
                
            # Find or create user
            user, created = Users.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': full_name,
                    'avatar_url': picture,
                    'password': str(uuid.uuid4())
                }
            )
            
            # Update info if exists
            if not created:
                updated = False
                # ធ្វើបច្ចុប្បន្នភាពឈ្មោះជានិច្ចឱ្យស្របតាម Google
                if full_name and user.full_name != full_name:
                    user.full_name = full_name
                    updated = True
                if picture and user.avatar_url != picture:
                    user.avatar_url = picture
                    updated = True
                if updated:
                    user.save()
            
            # If created, assign default role
            if created:
                # Find default 'User' role (same as RegisterSerializer)
                role = Role.objects.filter(name__iexact='User').first()
                if not role:
                    role, _ = Role.objects.get_or_create(name='User', defaults={'name_km': 'អ្នកប្រើប្រាស់'})
                user.role = role
                user.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Return same structure as standard login
            user_data = UserSerializer(user).data
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data
            })

        except ValueError as e:
            return Response({"error": f"Invalid ID token: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FacebookLoginView(APIView):
    """
    Endpoint to verify Facebook access token and return JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('access_token')
        if not token:
            return Response({"error": "Access token is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify token with Facebook Graph API
            import requests as py_requests
            response = py_requests.get(
                f"https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token={token}"
            )
            
            if response.status_code != 200:
                return Response({"error": "Invalid Facebook token"}, status=status.HTTP_400_BAD_REQUEST)
                
            fb_data = response.json()
            email = fb_data.get('email')
            full_name = fb_data.get('name', '')
            picture_data = fb_data.get('picture', {}).get('data', {})
            picture = picture_data.get('url', '')

            if not email:
                # Some Facebook accounts don't have email or it's not shared
                # Fallback to ID-based email or return error
                return Response({"error": "Email not provided by Facebook. Please ensure your Facebook account has a verified email."}, status=status.HTTP_400_BAD_REQUEST)

            # Find or create user
            user, created = Users.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': full_name,
                    'avatar_url': picture,
                    'password': str(uuid.uuid4())
                }
            )
            
            # Sync info
            updated = False
            if full_name and user.full_name != full_name:
                user.full_name = full_name
                updated = True
            if picture and user.avatar_url != picture:
                user.avatar_url = picture
                updated = True
            if updated:
                user.save()

            if created:
                role = Role.objects.filter(name__iexact='User').first()
                if not role:
                    role, _ = Role.objects.get_or_create(name='User', defaults={'name_km': 'អ្នកប្រើប្រាស់'})
                user.role = role
                user.save()

            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserProfileView(APIView):
    """
    Endpoint to retrieve or update the current user's profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        data = request.data
        
        # Update fields if provided
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'phone_number' in data: # Fallback if frontend sends phone_number
            user.phone = data['phone_number']
        
        # Handle Profile Image Upload
        if 'profile_image' in request.FILES:
            user.avatar_url = request.FILES['profile_image']
            
        if 'avatar_url' in data and not request.FILES.get('profile_image'):
            user.avatar_url = data['avatar_url']
            
        user.save()
        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    """
    Invalidates the refresh token by adding it to the blacklist.
    Expects 'refresh' in the POST data.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    """
    Public registration endpoint.
    """
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from decimal import Decimal

class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all().order_by('-created_at')
    serializer_class = CouponSerializer
    permission_classes = [HasGranularPermission]
    resource_name = 'coupons'
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'description']

class UserCouponViewSet(viewsets.ModelViewSet):
    serializer_class = UserCouponSerializer
    permission_classes = [HasGranularPermission]
    resource_name = 'user-coupons'

    def get_queryset(self):
        user_role = str(self.request.user.role.name if self.request.user.role else "").lower()
        if user_role == 'admin':
            return UserCoupon.objects.all().order_by('-assigned_at')
        return UserCoupon.objects.filter(user=self.request.user, is_used_up=False).order_by('-assigned_at')

    @action(detail=False, methods=['get'])
    def my_coupons(self, request):
        """Helper to get only active coupons for the current user"""
        coupons = UserCoupon.objects.filter(user=request.user, is_used_up=False)
        return Response(UserCouponSerializer(coupons, many=True).data)

    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        """Assign a coupon to multiple users at once"""
        user_ids = request.data.get('user_ids', [])
        coupon_id = request.data.get('coupon_id')
        remaining_percentage = request.data.get('remaining_percentage')

        if not user_ids or not coupon_id or remaining_percentage is None:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            coupon = Coupon.objects.get(id=coupon_id)
            for user_id in user_ids:
                # Use update_or_create to handle unique_together constraint
                UserCoupon.objects.update_or_create(
                    user_id=user_id,
                    coupon_code=coupon.code,
                    defaults={
                        'coupon': coupon,
                        'remaining_percentage': Decimal(str(remaining_percentage)),
                        'is_active': True,
                        'is_used_up': Decimal(str(remaining_percentage)) <= 0
                    }
                )
            return Response({"message": "Successfully assigned coupons"}, status=status.HTTP_201_CREATED)
        except Coupon.DoesNotExist:
            return Response({"error": "Coupon not found"}, status=status.HTTP_404_NOT_FOUND)

# --- ABA PayWay Views ---
from .payway import PayWayService
from rest_framework import views as drf_views

class PayWayInitiateView(drf_views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response({"error": "Order ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Orders.objects.get(id=order_id, user=request.user)
            order_items = OrderItems.objects.filter(order=order)
            
            items_data = []
            for item in order_items:
                items_data.append({
                    'name': item.book.title,
                    'quantity': str(item.quantity),
                    'price': "{:.2f}".format(float(item.price_at_purchase))
                })

            if not items_data:
                items_data.append({
                    'name': f"Order #{order.id}",
                    'quantity': "1",
                    'price': str(order.total_amount)
                })

            # Calculate shipping amount (Total - Sum of items)
            items_total = sum(float(item['price']) * int(item['quantity']) for item in items_data)
            shipping_amount = float(order.total_amount) - items_total
            if shipping_amount < 0:
                shipping_amount = 0
                
            payment_payload = PayWayService.get_payment_data(
                order, 
                items_data, 
                shipping_amount=shipping_amount
            )
            
            import requests
            
            api_url = payment_payload.pop('api_url', None)
            if not api_url:
                raise Exception("API URL is missing from payment payload")

            # Send S2S POST request directly to ABA PayWay
            aba_response = requests.post(api_url, data=payment_payload)
            aba_data = aba_response.json()

            # Save transaction ID and hash to payment record
            Payments.objects.update_or_create(
                order=order,
                defaults={
                    'transaction_id': payment_payload.get('tran_id'),
                    'amount': order.total_amount,
                    'payment_method': 'ABA PayWay',
                    'payment_status': 'Pending',
                    'aba_hash': payment_payload.get('hash')
                }
            )

            return Response(aba_data, status=status.HTTP_200_OK)

        except Orders.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PayWayCallbackView(drf_views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        tran_id = data.get("tran_id")
        apaba_status = data.get("status")
        
        if tran_id and apaba_status == "0":
            try:
                payment = Payments.objects.get(transaction_id=tran_id)
                order = payment.order
                
                # 1. Deduct Stock for ABA payment now that it's successful
                with transaction.atomic():
                    # Check stock again before deducting
                    for item in order.items.all():
                        book = item.book
                        if book.stock_qty is not None:
                            # Note: In high traffic, we should handle if stock became 0 while waiting for payment
                            # but here we follow the "deduct after paid" logic.
                            book.stock_qty -= item.quantity
                            book.save()
                
                payment.payment_status = 'Completed'
                payment.payment_date = timezone.now()
                payment.save()

                order.status = 'Processing'
                order.save()
                
                # Clear cart items associated with this order's batch
                if order.batch_id:
                    AddToCart.objects.filter(user=order.user, batch_id=order.batch_id).delete()
                
                Notification.objects.create(
                    user=order.user,
                    title="ការទូទាត់ជោគជ័យ",
                    message=f"ការទូទាត់សម្រាប់កម្មង់លេខ #{order.id} ត្រូវបានទទួល។",
                    type="success"
                )

                return Response({"status": "OK"}, status=status.HTTP_200_OK)
            except Payments.DoesNotExist:
                return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({"status": "Failed or Invalid"}, status=status.HTTP_400_BAD_REQUEST)

class PayWayCheckStatusView(drf_views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tran_id = request.query_params.get("tran_id")
        if not tran_id:
            return Response({"error": "tran_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payments.objects.get(transaction_id=tran_id)
            # If the user is an admin or the owner of the order
            user_role = str(request.user.role or "").lower()
            if user_role != 'admin' and payment.order.user != request.user:
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

            return Response({
                "status": 0 if payment.payment_status == 'Completed' else 1,
                "payment_status": payment.payment_status,
                "amount": payment.amount,
                "tran_id": payment.transaction_id
            })
        except Payments.DoesNotExist:
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

class FavoriteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FavoriteSerializer
    resource_name = 'favorites'

    def get_queryset(self):
        # Requirement: Filter out out-of-stock books
        return Favorite.objects.filter(
            user=self.request.user,
            book__stock_qty__gt=0,
            book__is_active=1
        ).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        book_id = request.data.get('book_id')
        if not book_id:
            return Response({"error": "book_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            book = Books.objects.get(id=book_id)
            favorite = Favorite.objects.filter(user=request.user, book=book).first()
            
            if favorite:
                favorite.delete()
                return Response({"status": "removed", "is_favorite": False})
            else:
                if book.stock_qty is not None and book.stock_qty <= 0:
                    return Response({"error": "សៀវភៅនេះអស់ពីស្តុកហើយ"}, status=status.HTTP_400_BAD_REQUEST)
                
                Favorite.objects.create(user=request.user, book=book)
                return Response({"status": "added", "is_favorite": True}, status=status.HTTP_201_CREATED)
                
        except Books.DoesNotExist:
            return Response({"error": "រកមិនឃើញសៀវភៅ"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def check(self, request):
        book_id = request.query_params.get('book_id')
        if not book_id:
            return Response({"error": "book_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        is_favorite = Favorite.objects.filter(user=request.user, book_id=book_id).exists()
        return Response({"is_favorite": is_favorite})

@api_view(['POST'])
@permission_classes([AllowAny])
def track_site_visit(request):
    """Increments the total visits for today."""
    from django.utils import timezone
    from .models import SiteStats
    today = timezone.now().date()
    stats, created = SiteStats.objects.get_or_create(date=today)
    SiteStats.objects.filter(date=today).update(total_visits=F('total_visits') + 1)
    return Response({"status": "success"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_analytics(request):
    """Returns analytics for admin dashboard."""
    # Check if user has admin role
    user_role = str(request.user.role.name if request.user.role else "").lower()
    if user_role != 'admin' and not request.user.is_staff:
        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
    from .models import SiteStats
    total_site_visits = SiteStats.objects.aggregate(total=Sum('total_visits'))['total'] or 0
    total_book_views = Books.objects.aggregate(total=Sum('views_count'))['total'] or 0
    
    # Get last 7 days of site visits
    recent_visits = SiteStats.objects.all().order_by('-date')[:7]
    visits_chart = [{"date": v.date.strftime('%Y-%m-%d'), "visits": v.total_visits} for v in reversed(recent_visits)]
    
    top_books = Books.objects.order_by('-views_count')[:10]
    
    return Response({
        "total_site_visits": total_site_visits,
        "total_book_views": total_book_views,
        "visits_chart": visits_chart,
        "top_books": BookSerializer(top_books, many=True).data
    })
