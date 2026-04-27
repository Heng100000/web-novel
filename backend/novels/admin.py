from django.contrib import admin
from .models import (
    Authors, Categories, Books, BookImages, Events, Users, AddToCart,
    Coupon, UserCoupon, CouponUsage
)


@admin.register(Authors)
class AuthorsAdmin(admin.ModelAdmin):
    list_display = ("name", "photo_url")
    search_fields = ("name",)


@admin.register(Categories)
class CategoriesAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")


@admin.register(Books)
class BooksAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "category", "price", "stock_qty", "is_active")
    list_filter = ("category", "author", "is_active")
    search_fields = ("title", "isbn")


@admin.register(BookImages)
class BookImagesAdmin(admin.ModelAdmin):
    list_display = ("book", "image_url", "is_main")


@admin.register(Events)
class EventsAdmin(admin.ModelAdmin):
    list_display = ("title", "discount_percentage", "start_date", "end_date", "status")
    list_filter = ("status",)
    search_fields = ("title",)


@admin.register(Users)
class UsersAdmin(admin.ModelAdmin):
    list_display = ("email", "full_name", "role", "phone")
    list_filter = ("role",)
    search_fields = ("email", "full_name")

@admin.register(AddToCart)
class AddToCartAdmin(admin.ModelAdmin):
    list_display = ("book", "quantity", "created_at")
    list_filter = ("created_at",)
    search_fields = ("book__title",)

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "total_percentage", "start_date", "end_date", "is_active")
    list_filter = ("is_active", "start_date", "end_date")
    search_fields = ("code", "description")

@admin.register(UserCoupon)
class UserCouponAdmin(admin.ModelAdmin):
    list_display = ("user", "coupon", "remaining_percentage", "is_used_up")
    list_filter = ("is_used_up",)
    search_fields = ("user__email", "coupon__code")

@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = ("user_coupon", "order", "percentage_used", "amount_saved", "used_at")
    list_filter = ("used_at",)
    search_fields = ("user_coupon__user__email", "user_coupon__coupon__code", "order__id")
