import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from novels.models import Payments

def fix_payments():
    print("Checking for payments with empty transaction_id strings...")
    # Find payments where transaction_id is an empty string
    empty_payments = Payments.objects.filter(transaction_id="")
    count = empty_payments.count()
    
    if count > 0:
        print(f"Found {count} payments with empty strings. Converting to NULL...")
        # Update all to None (NULL)
        updated = empty_payments.update(transaction_id=None)
        print(f"Successfully updated {updated} records.")
    else:
        print("No payments with empty string transaction_ids found.")

if __name__ == "__main__":
    fix_payments()
