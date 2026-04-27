from django.db.models.signals import post_save, post_delete, pre_save, pre_delete
from django.dispatch import receiver
from .models import AddToCart, Coupon, UserCoupon

@receiver(post_save, sender=AddToCart)
def reserve_stock(sender, instance, created, **kwargs):
    """
    When a book is added to the cart, decrease the book's stock quantity.
    Only happens on creation.
    """
    if created:
        book = instance.book
        if book.stock_qty is not None:
            book.stock_qty -= instance.quantity
            book.save()

@receiver(post_delete, sender=AddToCart)
def restore_stock(sender, instance, **kwargs):
    """
    When a cart entry is deleted (expired or manually), increase the book's stock quantity back.
    """
    book = instance.book
    if book.stock_qty is not None:
        book.stock_qty += instance.quantity
        book.save()

@receiver(pre_save, sender=UserCoupon)
def sync_coupon_code(sender, instance, **kwargs):
    """Ensure coupon_code is always synced with the linked coupon."""
    if instance.coupon and not instance.coupon_code:
        instance.coupon_code = instance.coupon.code

@receiver(pre_delete, sender=Coupon)
def freeze_user_coupons(sender, instance, **kwargs):
    """
    When a Coupon is deleted, freeze all associated UserCoupon records.
    The 'on_delete=SET_NULL' will handle setting the 'coupon' field to None.
    """
    UserCoupon.objects.filter(coupon=instance).update(is_active=False)

@receiver(pre_save, sender=Coupon)
def capture_old_total_percentage(sender, instance, **kwargs):
    """Capture the old total_percentage to calculate scaling factor if it changes."""
    if instance.pk:
        try:
            old_obj = Coupon.objects.get(pk=instance.pk)
            instance._old_total_percentage = old_obj.total_percentage
        except Coupon.DoesNotExist:
            instance._old_total_percentage = None
    else:
        instance._old_total_percentage = None

@receiver(post_save, sender=Coupon)
def sync_user_coupons_on_update(sender, instance, created, **kwargs):
    """
    1. Scale existing UserCoupon percentages if total_percentage changed.
    2. Reactivate frozen coupons if this is a new coupon.
    """
    if created:
        # Reactivate logic
        UserCoupon.objects.filter(
            coupon_code=instance.code, 
            coupon__isnull=True
        ).update(
            coupon=instance,
            is_active=True
        )
    else:
        # Scaling logic
        old_total = getattr(instance, '_old_total_percentage', None)
        if old_total and old_total != instance.total_percentage and old_total > 0:
            ratio = float(instance.total_percentage) / float(old_total)
            user_coupons = UserCoupon.objects.filter(coupon=instance)
            for uc in user_coupons:
                uc.remaining_percentage = float(uc.remaining_percentage) * ratio
                uc.save()

@receiver(post_save, sender=UserCoupon)
def auto_delete_empty_coupon(sender, instance, **kwargs):
    """Automatically delete the UserCoupon record if it reaches 0%."""
    from django.db import transaction
    if instance.remaining_percentage <= 0:
        # Create notification for admins
        from .models import Notification, Users
        admins = Users.objects.filter(role__name__iexact='Admin')
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title="ប័ណ្ណបញ្ចុះតម្លៃត្រូវបានប្រើអស់",
                message=f"អ្នកប្រើប្រាស់ {instance.user.full_name or instance.user.email} បានប្រើប្រាស់ប័ណ្ណ {instance.coupon_code} អស់ ១០០% ហើយ។",
                type='coupon_used'
            )

        # Use on_commit to avoid deleting the object while it's still being used in the current transaction
        transaction.on_commit(lambda: instance.delete() if UserCoupon.objects.filter(pk=instance.pk).exists() else None)



