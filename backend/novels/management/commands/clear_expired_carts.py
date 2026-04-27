from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from novels.models import AddToCart

class Command(BaseCommand):
    help = 'Clears cart entries older than 3 days and restores stock'

    def handle(self, *args, **options):
        threshold = timezone.now() - timedelta(days=3)
        expired_items = AddToCart.objects.filter(created_at__lt=threshold)
        
        count = expired_items.count()
        if count > 0:
            # We delete them in a loop to ensure signals are triggered for each deletion
            # (Bulk delete via queryset.delete() works but sometimes people want explicit signal handling)
            # Actually, queryset.delete() DOES trigger signals if they are connected normally, 
            # but let's be explicit and safe.
            for item in expired_items:
                item.delete()
            
            self.stdout.write(self.style.SUCCESS(f'Successfully deleted {count} expired cart entries.'))
        else:
            self.stdout.write(self.style.SUCCESS('No expired cart entries found.'))
