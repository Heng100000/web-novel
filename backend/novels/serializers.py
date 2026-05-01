from decimal import Decimal
from django.utils import timezone
from django.db import connection
from rest_framework import serializers
from .models import (
    Books, BookImages, Authors, Categories, Events, EventBooks, AddToCart,
    Orders, OrderItems, Payments, Invoices, Users, Role, RolePermission,
    Coupon, UserCoupon, CouponUsage, Notification
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

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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
    discount_percentage = serializers.SerializerMethodField()
    discount_type = serializers.SerializerMethodField()
    discount_value = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    discounted_price_riel = serializers.SerializerMethodField()

    author_details = AuthorSerializer(source='author', read_only=True)

    class Meta:
        model = Books
        fields = [
            "id", "title", "description", "isbn", "price", "price_riel", "stock_qty", 
            "is_active", "edition_type", "category", "author", "author_details",
            "images", "image_url", "event_id", "event_title", "discount_percentage", 
            "discount_type", "discount_value", "discounted_price", "discounted_price_riel"
        ]

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
        # Cache the event to avoid duplicate queries within the same object serialization
        if hasattr(obj, '_active_event'):
            return obj._active_event
        
        with connection.cursor() as cursor:
            # Join with events to check date and status in one query
            cursor.execute("""
                SELECT e.id, e.title, e.discount_percentage, e.discount_type, e.discount_value, e.start_date, e.end_date, e.status 
                FROM events e
                JOIN event_books eb ON e.id = eb.event_id
                WHERE eb.book_id = %s
                LIMIT 1
            """, [obj.id])
            row = cursor.fetchone()
            
            if row:
                ev_id, ev_title, disc_pct, d_type, d_val, start, end, stat = row
                
                # Robustly handle potential naive/aware comparison issues
                def make_aware(dt):
                    if dt and timezone.is_naive(dt):
                        return timezone.make_aware(dt)
                    return dt

                now = timezone.now()
                aware_start = make_aware(start)
                aware_end = make_aware(end)

                # Check if event is active and within date range
                if stat == "Active" and aware_start <= now <= aware_end:
                    obj._active_event = {
                        "id": ev_id, 
                        "title": ev_title, 
                        "discount_pct": disc_pct,
                        "discount_type": d_type,
                        "discount_value": d_val
                    }
                else:
                    obj._active_event = None
            else:
                obj._active_event = None
        
        return obj._active_event

    def get_event_id(self, obj):
        event = self._get_active_event(obj)
        return event["id"] if event else None

    def get_event_title(self, obj):
        event = self._get_active_event(obj)
        return event["title"] if event else None

    def get_discount_percentage(self, obj):
        event = self._get_active_event(obj)
        return event["discount_pct"] if event else 0

    def get_discount_type(self, obj):
        event = self._get_active_event(obj)
        return event["discount_type"] if event else 'Percentage'

    def get_discount_value(self, obj):
        event = self._get_active_event(obj)
        return event["discount_value"] if event else 0

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
                'role_details': {
                    'name': self.user.role.name if self.user.role else None,
                    'name_km': self.user.role.name_km if self.user.role else None,
                },
                'permissions': RolePermissionSerializer(
                    RolePermission.objects.filter(role=self.user.role), 
                    many=True
                ).data if self.user.role else []
            }
            
            return data

class AddToCartSerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source='book', read_only=True)
    
    class Meta:
        model = AddToCart
        fields = ["id", "book", "book_details", "quantity", "batch_id", "created_at"]

class OrderItemSerializer(serializers.ModelSerializer):
    book_details = BookSerializer(source='book', read_only=True)

    class Meta:
        model = OrderItems
        fields = ["id", "book", "book_details", "quantity", "price_at_purchase"]

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payments
        fields = ["id", "payment_method", "transaction_id", "amount", "payment_status", "payment_date"]

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
    role_details = RoleSerializer(source='role', read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Users
        fields = ["id", "email", "password", "full_name", "role", "role_details", "permissions", "phone", "address", "reward_points", "created_at"]
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

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