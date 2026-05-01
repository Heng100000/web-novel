from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    name_km = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'roles'
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.name

class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions')
    resource = models.CharField(max_length=50) # e.g., 'books', 'authors', 'orders'
    can_view = models.BooleanField(default=False)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        managed = True
        db_table = 'role_permissions'
        unique_together = ('role', 'resource')
        verbose_name_plural = "Role Permissions"

    def __str__(self):
        return f"{self.role.name} - {self.resource}"

class UsersManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role_id', 1)
        return self.create_user(email, password, **extra_fields)

class Authors(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=150)
    name_km = models.CharField(max_length=150, blank=True, null=True)
    biography = models.TextField(blank=True, null=True)
    photo_url = models.ImageField(upload_to='authors/', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'authors'
        verbose_name_plural = "Authors"

    def __str__(self):
        return self.name

class Categories(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    name_km = models.CharField(max_length=150, blank=True, null=True)
    slug = models.CharField(unique=True, max_length=100)

    class Meta:
        managed = False
        db_table = 'categories'
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Books(models.Model):
    id = models.AutoField(primary_key=True)
    category = models.ForeignKey(Categories, models.DO_NOTHING, blank=True, null=True)
    author = models.ForeignKey(Authors, models.DO_NOTHING, blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    isbn = models.CharField(unique=True, max_length=20, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    price_riel = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, default=0)
    stock_qty = models.IntegerField(blank=True, null=True)
    edition_type = models.CharField(max_length=15, blank=True, null=True)
    is_active = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'books'
        verbose_name_plural = "Books"

    def __str__(self):
        return self.title

class BookImages(models.Model):
    book = models.ForeignKey(Books, models.DO_NOTHING, blank=True, null=True)
    image_url = models.ImageField(upload_to='books/')
    is_main = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'book_images'

class Events(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    discount_type = models.CharField(max_length=20, default='Percentage', blank=True, null=True) # Percentage or Fixed Amount
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    show_in_banner = models.IntegerField(blank=True, null=True)
    show_in_homepage = models.IntegerField(blank=True, null=True)
    banner_url = models.ImageField(upload_to='events/', blank=True, null=True)
    status = models.CharField(max_length=8, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'events'

    def __str__(self):
        return self.title

class EventBooks(models.Model):
    event = models.ForeignKey(Events, models.DO_NOTHING)
    book = models.ForeignKey(Books, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'event_books'
        # Composite PK or just use ID if it exists? 
        # Junction tables often don't have an 'id' but inspectdb showed it exists as a composite.
        # For Django models without pk, we usually set primary_key=True on one of them if there's no id.
        # But if the table exists, Django usually needs a PK.
        # I'll add an 'id' field if it exists or just make one a PK.
        # Actually, let's just use the default 'id' field since most junction tables have one either way.

class Users(AbstractBaseUser):
    id = models.AutoField(primary_key=True)
    email = models.CharField(unique=True, max_length=150)
    password = models.CharField(max_length=255, db_column='password_hash')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, blank=True, null=True, db_column='role_id')
    full_name = models.CharField(max_length=150, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(blank=True, null=True)
    reward_points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    objects = UsersManager()

    last_login = None

    class Meta:
        managed = False
        db_table = 'users'

    def __str__(self):
        return self.email

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def get_username(self):
        return self.email

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_active(self):
        return True

    # Required for Django Admin to show the user correctly in some contexts
    def has_perm(self, perm, obj=None):
        return self.role.name == 'Admin' if self.role else False

    def has_module_perms(self, app_label):
        return self.role.name == 'Admin' if self.role else False

    @property
    def is_staff(self):
        return self.role.name == 'Admin' if self.role else False


class Coupon(models.Model):
    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)
    total_percentage = models.DecimalField(max_digits=5, decimal_places=2) # e.g. 50.00
    description = models.TextField(blank=True, null=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'coupons'
        verbose_name_plural = "Coupons"

    def __str__(self):
        return f"{self.code} ({self.total_percentage}%)"

class UserCoupon(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='user_coupons')
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True)
    coupon_code = models.CharField(max_length=50, null=True, blank=True)
    remaining_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    is_used_up = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'user_coupons'
        unique_together = ('user', 'coupon_code')
        verbose_name_plural = "User Coupons"

    def __str__(self):
        return f"{self.user.email} - {self.coupon_code} (Rem: {self.remaining_percentage}%)"

class CouponUsage(models.Model):
    id = models.AutoField(primary_key=True)
    user_coupon = models.ForeignKey(UserCoupon, on_delete=models.SET_NULL, related_name='usages', null=True, blank=True)
    coupon_code = models.CharField(max_length=50, null=True, blank=True)
    order = models.ForeignKey('Orders', on_delete=models.CASCADE, related_name='coupon_usages')
    percentage_used = models.DecimalField(max_digits=5, decimal_places=2)
    amount_saved = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'coupon_usages'
        verbose_name_plural = "Coupon Usages"

class AddToCart(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Users, on_delete=models.CASCADE, null=True, blank=True)
    book = models.ForeignKey(Books, models.DO_NOTHING)
    quantity = models.PositiveIntegerField(default=1)
    batch_id = models.CharField(max_length=50, blank=True, null=True) # UUID or Date-based ID for grouping
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'add_to_cart'
        verbose_name_plural = "Add To Cart Entries"

    def __str__(self):
        return f"{self.book.title} ({self.quantity})"

class Orders(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Users, on_delete=models.CASCADE, blank=True, null=True)
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='Pending') # Pending, Processing, Completed, Cancelled
    shipping_address = models.TextField()
    shipping_method = models.CharField(max_length=50, default='Pick Up')
    notes = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'orders'
        verbose_name_plural = "Orders"

    def __str__(self):
        return f"Order #{self.id} - {self.user.email if self.user else 'Guest'}"

class UserOTP(models.Model):
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    class Meta:
        db_table = 'user_otps'
        managed = True

class OrderItems(models.Model):
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Orders, related_name='items', on_delete=models.CASCADE)
    book = models.ForeignKey(Books, on_delete=models.PROTECT)
    quantity = models.IntegerField()
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = True
        db_table = 'order_items'
        verbose_name_plural = "Order Items"

class Payments(models.Model):
    id = models.AutoField(primary_key=True)
    order = models.OneToOneField(Orders, on_delete=models.CASCADE, related_name='payment')
    payment_method = models.CharField(max_length=50, blank=True, null=True) # Cash, Bank Transfer, Card
    transaction_id = models.CharField(unique=True, max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=15, default='Pending') # Pending, Completed, Failed
    payment_date = models.DateTimeField(blank=True, null=True)
    aba_hash = models.TextField(blank=True, null=True) # Store the hash sent to ABA
    raw_response = models.JSONField(blank=True, null=True) # Store full response from ABA callback

    class Meta:
        managed = True
        db_table = 'payments'
        verbose_name_plural = "Payments"

class Invoices(models.Model):
    id = models.AutoField(primary_key=True)
    invoice_no = models.CharField(unique=True, max_length=50)
    order = models.OneToOneField(Orders, on_delete=models.CASCADE, related_name='invoice')
    customer_name = models.CharField(max_length=255)
    billing_address = models.TextField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'invoices'
        verbose_name_plural = "Invoices"

    def __str__(self):
        return self.invoice_no

class Notification(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50, default='info') # info, success, warning, error, coupon_used
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'notifications'
        verbose_name_plural = "Notifications"

    def __str__(self):
        return self.title