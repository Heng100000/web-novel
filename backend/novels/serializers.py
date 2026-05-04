from decimal import Decimal
from django.utils import timezone
from django.db import connection
from rest_framework import serializers
from .models import (
    Books, BookImages, Authors, Categories, Events, EventBooks, AddToCart,
    Orders, OrderItems, Payments, Invoices, Users, Role, RolePermission,
    Coupon, UserCoupon, CouponUsage, Notification, Favorite
)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = "__all__"

class UserCouponSerializer(serializers.ModelSerializer):
    coupon_details = CouponSerializer(source='coupon', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserCoupon
        fields = [
            "id", "user", "user_email", "coupon", "coupon_code", 
            "coupon_details", "remaining_percentage", "is_used_up", 
            "is_active", "assigned_at"
        ]

class CouponUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CouponUsage
        fields = "__all__"

class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = ["resource", "can_view", "can_create", "can_edit", "can_delete"]

class RoleSerializer(serializers.ModelSerializer):
    permissions = RolePermissionSerializer(many=True, read_only=True)
    users_count = serializers.SerializerMethodField()
    permissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ["id", "name", "name_km", "description", "permissions", "users_count", "permissions_count"]

    def get_users_count(self, obj):
        return Users.objects.filter(role=obj).count()

    def get_permissions_count(self, obj):
        perms = RolePermission.objects.filter(role=obj)
        count = 0
        for p in perms:
            if p.can_view: count += 1
            if p.can_create: count += 1
            if p.can_edit: count += 1
            if p.can_delete: count += 1
        return count

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    role_details = RoleSerializer(source='role', read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Users
        fields = ["id", "email", "password", "full_name", "role", "role_details", "permissions", "phone", "address", "reward_points", "avatar_url", "created_at"]
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def get_avatar_url(self, obj):
        if not obj.avatar_url:
            return None
        
        # ប្រសិនបើជា URL ពេញ (ពី Google/Facebook) ឱ្យវាបង្ហាញផ្ទាល់តែម្ដង
        url_str = str(obj.avatar_url)
        if url_str.startswith(('http://', 'https://')):
            return url_str
            
        # បើមិនដូច្នោះទេ ប្រើ URL របស់ Django Media
        try:
            return obj.avatar_url.url
        except:
            return url_str

    def get_permissions(self, obj):
        if not obj.role:
            return []
        perms = RolePermission.objects.filter(role=obj.role)
        return RolePermissionSerializer(perms, many=True).data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Users
        fields = ["email", "password", "password_confirm", "full_name", "phone"]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "លេខសម្ងាត់មិនត្រូវគ្នាទេ។"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Find default 'User' role
        role = Role.objects.filter(name__iexact='User').first()
        if not role:
            # Fallback or create if missing
            role, _ = Role.objects.get_or_create(name='User', defaults={'name_km': 'អ្នកប្រើប្រាស់'})
            
        user = Users.objects.create_user(
            password=password,
            role=role,
            **validated_data
        )
        return user

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        with open("debug_auth.log", "a") as f:
            f.write(f"DEBUG SERIALIZER: Received keys: {list(attrs.keys())}\n")
            # We ensure both 'email' and 'username' keys are present in attrs 
            # to satisfy potential backend keyword argument expectations.
            email = attrs.get("email") or attrs.get("username")
            if email:
                attrs["email"] = email
                attrs["username"] = email
            
            # 1. Pre-authentication Lock Check
            user_obj = None
            if email:
                user_obj = Users.objects.filter(email__iexact=email).first()
                if user_obj and user_obj.locked_until and user_obj.locked_until > timezone.now():
                    remaining = (user_obj.locked_until - timezone.now()).total_seconds()
                    minutes = int(remaining // 60) + 1
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied({
                        "detail": f"គណនីរបស់អ្នកត្រូវបានចាក់សោបណ្តោះអាសន្ន។ សូមព្យាយាមម្តងទៀតក្នុងរយៈពេល {minutes} នាទី។",
                        "locked_until": user_obj.locked_until.isoformat() if user_obj.locked_until else None
                    })

            try:
                data = super().validate(attrs)
                f.write("DEBUG SERIALIZER: super().validate(attrs) succeeded\n")
            except Exception as e:
                # 2. Post-authentication Lock Check (in case this attempt triggered the lock)
                if user_obj:
                    user_obj.refresh_from_db()
                    if user_obj.locked_until and user_obj.locked_until > timezone.now():
                         from rest_framework.exceptions import PermissionDenied
                         raise PermissionDenied({
                            "detail": "អ្នកបានបញ្ចូលលេខសម្ងាត់ខុស ៥ ដងជាប់គ្នា។ គណនីរបស់អ្នកត្រូវបានចាក់សោរយៈពេល ៥ នាទី។",
                            "locked_until": user_obj.locked_until.isoformat()
                        })
                
                f.write(f"DEBUG SERIALIZER: super().validate(attrs) failed with: {str(e)}\n")
                raise e

            # Include essential user details in the token response for frontend convenience
            # Use same structure as UserSerializer for consistency
            data['user'] = {
                'id': self.user.id,
                'email': self.user.email,
                'full_name': self.user.full_name,
                'phone': self.user.phone,
                'address': self.user.address,
                'role': self.user.role.id if self.user.role else None,
                'reward_points': self.user.reward_points,
                'avatar_url': (
                    str(self.user.avatar_url) if str(self.user.avatar_url).startswith('http')
                    else (self.user.avatar_url.url if self.user.avatar_url and hasattr(self.user.avatar_url, 'url') else str(self.user.avatar_url))
                ),
                'role_details': {
                    'id': self.user.role.id if self.user.role else None,
                    'name': self.user.role.name if self.user.role else None,
                    'name_km': self.user.role.name_km if self.user.role else None,
                },
                'permissions': RolePermissionSerializer(
                    RolePermission.objects.filter(role=self.user.role), 
                    many=True
                ).data if self.user.role else []
            }
            
            return data

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Authors
        fields = "__all__"


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Categories
        fields = "__all__"


class BookImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookImages
        fields = ["id", "image_url", "is_main"]


class BookSerializer(serializers.ModelSerializer):
    images = BookImageSerializer(many=True, read_only=True, source='bookimages_set')
    image_url = serializers.SerializerMethodField()
    event_id = serializers.SerializerMethodField()
    event_title = serializers.SerializerMethodField()
    event_end_date = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    discount_type = serializers.SerializerMethodField()
    discount_value = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    discounted_price_riel = serializers.SerializerMethodField()
    
    event_type = serializers.SerializerMethodField()
    flash_sale_qty = serializers.SerializerMethodField()
    items_sold = serializers.SerializerMethodField()

    author_details = AuthorSerializer(source='author', read_only=True)
    category_details = CategorySerializer(source='category', read_only=True)

    class Meta:
        model = Books
        fields = [
            "id", "title", "description", "isbn", "price", "price_riel", "stock_qty", 
            "is_active", "edition_type", "category", "category_details", "author", "author_details",
            "images", "image_url", "event_id", "event_title", "event_end_date", "discount_percentage", 
            "discount_type", "discount_value", "discounted_price", "discounted_price_riel",
            "event_type", "flash_sale_qty", "items_sold", "views_count"
        ]

    def validate_isbn(self, value):
        if value == "" or value is None:
            return None
        return value

    def get_image_url(self, obj):
        # Get the main image, or the first image, or None
        main_img = obj.bookimages_set.filter(is_main=1).first()
        if not main_img:
            main_img = obj.bookimages_set.first()
        
        if main_img and main_img.image_url:
            try:
                # If it's an ImageField, we should return the .url
                return main_img.image_url.url
            except Exception:
                # Fallback to the raw string value if .url fails
                return str(main_img.image_url)
        return None

    def _get_active_event(self, obj):
        # 1. Check local cache first
        if hasattr(obj, '_active_event'):
            return obj._active_event
        
        # 2. Use ORM for better performance and caching
        # We look for an active event that includes this book
        from .models import Events
        now = timezone.now()
        
        # Filter for active events that are within the current date range
        # Note: If we use prefetch_related in the view, this can be even faster
        event = Events.objects.filter(
            event_books__book=obj,
            status='Active',
            start_date__lte=now,
            end_date__gte=now
        ).first()

        if event:
            # Get the specific event-book details for flash sale tracking
            eb = EventBooks.objects.filter(event=event, book=obj).first()
            
            obj._active_event = {
                "id": event.id, 
                "title": event.title, 
                "discount_pct": event.discount_percentage,
                "discount_type": event.discount_type,
                "discount_value": event.discount_value,
                "end_date": event.end_date,
                "event_type": event.event_type,
                "flash_sale_qty": eb.flash_sale_qty if eb else 0,
                "items_sold": eb.items_sold if eb else 0
            }
        else:
            obj._active_event = None
            
        return obj._active_event

    def get_event_id(self, obj):
        event = self._get_active_event(obj)
        return event["id"] if event else None

    def get_event_title(self, obj):
        event = self._get_active_event(obj)
        return event["title"] if event else None

    def get_event_end_date(self, obj):
        event = self._get_active_event(obj)
        return event["end_date"].isoformat() if event and event.get("end_date") else None

    def get_discount_percentage(self, obj):
        event = self._get_active_event(obj)
        return event["discount_pct"] if event else 0

    def get_discount_type(self, obj):
        event = self._get_active_event(obj)
        return event["discount_type"] if event else 'Percentage'

    def get_discount_value(self, obj):
        event = self._get_active_event(obj)
        return event["discount_value"] if event else 0

    def get_event_type(self, obj):
        event = self._get_active_event(obj)
        return event["event_type"] if event else 'Promotion'

    def get_flash_sale_qty(self, obj):
        event = self._get_active_event(obj)
        return event["flash_sale_qty"] if event else 0

    def get_items_sold(self, obj):
        event = self._get_active_event(obj)
        return event["items_sold"] if event else 0

    def get_discounted_price(self, obj):
        event = self._get_active_event(obj)
        if not event or obj.price is None:
            return obj.price

        try:
            original_price = Decimal(str(obj.price))
            # Get values from event data
            val = Decimal(str(event.get("discount_value") or 0))
            pct = Decimal(str(event.get("discount_pct") or 0))

            if event.get("discount_type") == 'Fixed Amount':
                # Apply fixed Riel discount to USD price (approx 4000:1)
                discounted = original_price - (val / Decimal('4000.0'))
            else: # Percentage
                # Use discount_pct if available, otherwise fallback to discount_value
                effective_pct = pct if pct > 0 else val
                discounted = original_price * (Decimal('1.0') - (effective_pct / Decimal('100.0')))
            
            return max(round(discounted, 2), Decimal('0.00'))
        except Exception:
            return obj.price

    def get_discounted_price_riel(self, obj):
        event = self._get_active_event(obj)
        price_riel = obj.price_riel or (obj.price * Decimal('4000.0')) if obj.price else Decimal('0.00')
        
        if not event:
            return price_riel

        try:
            original_riel = Decimal(str(price_riel))
            val = Decimal(str(event.get("discount_value") or 0))
            pct = Decimal(str(event.get("discount_pct") or 0))

            if event.get("discount_type") == 'Fixed Amount':
                # Applied directly as Riel
                discounted = original_riel - val
            else: # Percentage
                # Use discount_pct if available, otherwise fallback to discount_value
                effective_pct = pct if pct > 0 else val
                discounted = original_riel * (Decimal('1.0') - (effective_pct / Decimal('100.0')))
            
            return max(round(discounted, 2), Decimal('0.00'))
        except Exception:
            return price_riel


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Events
        fields = "__all__"

class AddToCartSerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source='book', read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = AddToCart
        fields = ["id", "book", "book_details", "user", "user_details", "quantity", "batch_id", "created_at"]

class FavoriteSerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source='book', read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "user", "book", "book_details", "created_at"]

class OrderItemSerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source='book', read_only=True)

    class Meta:
        model = OrderItems
        fields = ["id", "book", "book_details", "quantity", "price_at_purchase"]

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payments
        fields = ["id", "payment_method", "transaction_id", "amount", "payment_status", "payment_date", "receipt_image"]

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoices
        fields = ["id", "invoice_no", "customer_name", "billing_address", "subtotal", "tax_amount", "total_amount", "created_at"]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    invoice = InvoiceSerializer(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Orders
        fields = ["id", "user_email", "user_phone", "user_name", "order_date", "total_amount", "status", "shipping_address", "shipping_method", "items", "payment", "invoice"]