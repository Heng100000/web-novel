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
from django.http import JsonResponse
from rest_framework import viewsets, status, filters, permissions, response, views as drf_views
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
    Books, BookImages, Authors, Categories, Events, EventBooks, AddToCart, 
    Orders, OrderItems, Payments, Invoices, Users, Role, RolePermission,
    Coupon, UserCoupon, CouponUsage, UserOTP
)
from .serializers import (
    BookSerializer, AuthorSerializer, CategorySerializer, 
    EventSerializer, CustomTokenObtainPairSerializer, AddToCartSerializer,
    OrderSerializer, OrderItemSerializer, PaymentSerializer, UserSerializer,
    RegisterSerializer,
    RoleSerializer, RolePermissionSerializer,
    CouponSerializer, UserCouponSerializer, CouponUsageSerializer, NotificationSerializer
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

# Run immediately when views are loaded
# ensure_user_schema()

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

    def get_queryset(self):
        queryset = Books.objects.all()
        
        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
            
        # Optional: Filter by author
        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(author_id=author_id)
            
        # Filter by discount status
        has_discount = self.request.query_params.get('has_discount')
        if has_discount == 'true':
            from django.utils import timezone
            now = timezone.now()
            # Find books that have an active event associated with them via EventBooks
            queryset = queryset.filter(
                eventbooks__event__status='Active',
                eventbooks__event__start_date__lte=now,
                eventbooks__event__end_date__gte=now
            ).distinct()
            
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            # 1. Extract non-image data
            book_data = {
                'title': request.data.get('title'),
                'price': request.data.get('price'),
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
                # Ensure directory exists
                upload_dir = os.path.join(settings.MEDIA_ROOT, 'books')
                os.makedirs(upload_dir, exist_ok=True)

                for idx, image_file in enumerate(images):
                    # Generate unique filename
                    ext = os.path.splitext(image_file.name)[1]
                    filename = f"{uuid.uuid4()}{ext}"
                    file_path = os.path.join(upload_dir, filename)

                    # Save physical file
                    with open(file_path, 'wb+') as destination:
                        for chunk in image_file.chunks():
                            destination.write(chunk)

                    # Save record in database
                    image_url = f"{settings.MEDIA_URL}books/{filename}"
                    BookImages.objects.create(
                        book=book,
                        image_url=image_url,
                        is_main=1 if idx == main_image_idx else 0
                    )

            # 4. Handle Event Association (Using Raw SQL to handle composite PK)
            event_id = request.data.get('event_id')
            if event_id and event_id != "" and event_id != "null":
                with connection.cursor() as cursor:
                    cursor.execute(
                        "INSERT INTO event_books (event_id, book_id) VALUES (%s, %s)",
                        [event_id, book.id]
                    )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"DEBUG ERROR: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # 1. Prepare data for serializer
        data = request.data.copy()
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # 2. Add New Images (optional during edit)
        images = request.FILES.getlist('images')
        if images:
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'books')
            os.makedirs(upload_dir, exist_ok=True)

            for image_file in images:
                ext = os.path.splitext(image_file.name)[1]
                filename = f"{uuid.uuid4()}{ext}"
                file_path = os.path.join(upload_dir, filename)

                with open(file_path, 'wb+') as destination:
                    for chunk in image_file.chunks():
                        destination.write(chunk)

                image_url = f"{settings.MEDIA_URL}books/{filename}"
                BookImages.objects.create(
                    book=instance,
                    image_url=image_url,
                    is_main=0 # Default to 0 for new non-primary images
                )

        # 3. Handle Event Association (Using Raw SQL to handle composite PK)
        if 'event_id' in data:
            event_id = data.get('event_id')
            with connection.cursor() as cursor:
                # Clear existing associations for this book
                cursor.execute("DELETE FROM event_books WHERE book_id = %s", [instance.id])
                
                if event_id and event_id != "" and event_id != "null":
                    cursor.execute(
                        "INSERT INTO event_books (event_id, book_id) VALUES (%s, %s)",
                        [event_id, instance.id]
                    )

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
            # Ensure directory exists
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'authors')
            os.makedirs(upload_dir, exist_ok=True)

            # Generate unique filename
            ext = os.path.splitext(photo_file.name)[1]
            filename = f"{uuid.uuid4()}{ext}"
            file_path = os.path.join(upload_dir, filename)

            # Save physical file
            with open(file_path, 'wb+') as destination:
                for chunk in photo_file.chunks():
                    destination.write(chunk)

            # Update database record
            author.photo_url = f"{settings.MEDIA_URL}authors/{filename}"
            author.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Categories.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    resource_name = 'categories'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'name_km']


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

    def get_queryset(self):
        # Only show entries belonging to the current user
        return AddToCart.objects.filter(user=self.request.user).order_by('-created_at')

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
            
            # Stock check
            try:
                book = Books.objects.get(id=book_id)
                if book.stock_qty is not None and quantity > book.stock_qty:
                    return Response(
                        {"error": f"Insufficient stock for '{book.title}'. Available: {book.stock_qty}"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Books.DoesNotExist:
                continue

            # Create or update entry? The user said "product ដែលពួកគេបាន add ត្រូវរក្សាទុកក្នុង record តែមួយដូចគ្នា"
            # If the same book is added again today, we could just increase quantity, 
            # but to stay safe with the "record" requirement, we'll keep it simple for now or merge.
            # Merging is better:
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


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [HasGranularPermission]
    resource_name = 'orders'
    serializer_class = OrderSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['id', 'user__email', 'user__full_name', 'status', 'shipping_address']

    def get_queryset(self):
        user_role = str(self.request.user.role or "").lower()
        if user_role == 'admin':
            return Orders.objects.all().order_by('-order_date')
        return Orders.objects.filter(user=self.request.user).order_by('-order_date')

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
                    payment.save()
                else:
                    raise Exception("Payment record missing for this order.")

                # 2. Generate Invoice
                invoice_no = f"INV-{timezone.now().strftime('%Y%m%d')}-{order.id:04d}"
                Invoices.objects.create(
                    invoice_no=invoice_no,
                    order=order,
                    customer_name=order.user.full_name or order.user.email,
                    billing_address=order.shipping_address,
                    subtotal=order.total_amount, # Simplifying: subtotal = total for now
                    total_amount=order.total_amount
                )
                
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
                order.status = 'Cancelled'
                order.save()
                
                # Restore Stock
                for item in order.items.all():
                    book = item.book
                    if book.stock_qty is not None:
                        book.stock_qty += item.quantity
                        book.save()
                        
                # Update payment status
                if hasattr(order, 'payment'):
                    order.payment.payment_status = 'Failed' # Or 'Cancelled'
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
        
        total_revenue = Orders.objects.filter(status='Completed').aggregate(total=Sum('total_amount'))['total'] or 0
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_revenue = Orders.objects.filter(status='Completed', order_date__gte=today_start).aggregate(total=Sum('total_amount'))['total'] or 0
        pending_orders = Orders.objects.filter(status='Pending').count()
        
        # 4. Invoice specific stats
        total_invoices = Invoices.objects.count()
        invoiced_revenue = Invoices.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        
        # 5. Customer stats
        total_customers = Users.objects.exclude(role__name__iexact='Admin').count()
        
        # 6. Calculate Dynamic Growth (Last 7 days vs Previous 7 days)
        revenue_growth = self._calculate_growth(Orders.objects.filter(status='Completed'), 'order_date', 'total_amount')
        invoice_growth = self._calculate_growth(Invoices.objects.all(), 'created_at')
        customer_growth = self._calculate_growth(Users.objects.exclude(role__name__iexact='Admin'), 'created_at')
        unpaid_growth = self._calculate_growth(Orders.objects.filter(status='Pending'), 'order_date')

        # 7. Chart Data: Invoice Stats (Paid, Overdue, Unpaid)
        seven_days_ago = timezone.now() - timedelta(days=7)
        paid_count = Orders.objects.filter(status='Completed').count()
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
        recent_orders = Orders.objects.filter(status='Completed', order_date__gte=six_months_ago)
        
        # Initialize final_sales_chart with month names
        final_sales_chart = []
        now = timezone.now()
        for i in range(5, -1, -1):
            # Roughly calculate month start
            month_date = (now.replace(day=1) - timedelta(days=i*31)).replace(day=1)
            final_sales_chart.append({
                "month": month_date.strftime('%b'),
                "amount": 0.0
            })
            
        # Group and sum in Python
        for order in recent_orders:
            m_name = order.order_date.strftime('%b')
            for entry in final_sales_chart:
                if entry["month"] == m_name:
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
                    status='Pending'
                )

                # 4. Create Order Items & Deduct Stock
                for item_data in items_to_create:
                    OrderItems.objects.create(
                        order=order,
                        book=item_data['book'],
                        quantity=item_data['quantity'],
                        price_at_purchase=item_data['price_at_purchase']
                    )
                    # Update Stock
                    if item_data['book'].stock_qty is not None:
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
                payment.payment_status = 'Completed'
                payment.payment_date = timezone.now()
                payment.save()

                order = payment.order
                order.status = 'Processing'
                order.save()
                
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
