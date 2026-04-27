import os
import sys
import django
from decimal import Decimal

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from novels.models import Coupon, UserCoupon, Users

def test_logic():
    print("Starting test...")
    
    # 1. Get or create a test user
    user = Users.objects.filter(email='admin@example.com').first()
    if not user:
        user = Users.objects.first()
    
    if not user:
        print("No user found in DB. Please create a user first.")
        return

    code = "TESTCODE"
    
    # Clean up existing test data
    Coupon.objects.filter(code=code).delete()
    UserCoupon.objects.filter(coupon_code=code).delete()

    # 2. Create a Coupon
    print(f"Creating coupon {code}...")
    coupon = Coupon.objects.create(
        code=code,
        total_percentage=Decimal('50.00'),
        description="Test Coupon"
    )

    # 3. Assign to user
    print(f"Assigning {code} to user {user.email}...")
    user_coupon = UserCoupon.objects.create(
        user=user,
        coupon=coupon,
        remaining_percentage=Decimal('50.00')
    )
    
    # Verify sync_coupon_code signal
    print(f"Initial UserCoupon coupon_code: {user_coupon.coupon_code}")
    assert user_coupon.coupon_code == code
    assert user_coupon.is_active == True

    # 4. Delete the Coupon
    print(f"Deleting coupon {code}...")
    coupon.delete()
    
    # Refresh user_coupon
    user_coupon.refresh_from_db()
    print(f"UserCoupon after delete - coupon: {user_coupon.coupon}, is_active: {user_coupon.is_active}")
    assert user_coupon.coupon == None
    assert user_coupon.is_active == False
    assert user_coupon.coupon_code == code

    # 5. Recreate the Coupon
    print(f"Recreating coupon {code} with different percentage...")
    new_coupon = Coupon.objects.create(
        code=code,
        total_percentage=Decimal('30.00'),
        description="New Test Coupon"
    )
    
    # Refresh user_coupon
    user_coupon.refresh_from_db()
    print(f"UserCoupon after recreate - coupon: {user_coupon.coupon}, is_active: {user_coupon.is_active}")
    assert user_coupon.coupon == new_coupon
    assert user_coupon.is_active == True
    
    print("\nSUCCESS: Coupon auto-freeze and reactivation logic works correctly!")

if __name__ == "__main__":
    test_logic()
