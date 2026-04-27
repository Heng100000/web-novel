import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings') # Corrected to config.settings
django.setup()

from novels.models import Orders, Invoices
from django.utils import timezone

def backfill():
    orders = Orders.objects.filter(status='Completed', invoice__isnull=True)
    count = 0
    for o in orders:
        invoice_no = f"INV-{timezone.now().strftime('%Y%m%d')}-{o.id:04d}"
        Invoices.objects.create(
            invoice_no=invoice_no,
            order=o,
            customer_name=(o.user.full_name or o.user.email) if o.user else "Guest",
            billing_address=o.shipping_address,
            subtotal=o.total_amount,
            total_amount=o.total_amount
        )
        count += 1
    print(f"Successfully backfilled {count} invoices.")

if __name__ == "__main__":
    backfill()
