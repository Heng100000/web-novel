import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from novels.models import Coupon, UserCoupon, Users

def test_new_logic():
    print("Starting new logic test...")
    
    # Setup test user
    user, _ = Users.objects.get_or_create(email="test@example.com", defaults={"full_name": "Test User"})
    
    # 1. Test Auto-delete when 0%
    print("\n--- Test 1: Auto-delete when 0% ---")
    c1 = Coupon.objects.create(code="ZERO_TEST", total_percentage=50)
    uc1 = UserCoupon.objects.create(user=user, coupon=c1, remaining_percentage=50)
    print(f"Initial: {uc1}")
    
    uc1.remaining_percentage = 0
    uc1.save()
    
    exists = UserCoupon.objects.filter(id=uc1.id).exists()
    print(f"Exists after setting to 0%: {exists}")
    if not exists:
        print("SUCCESS: UserCoupon deleted automatically.")
    else:
        print("FAILURE: UserCoupon still exists.")
    
    # 2. Test Percentage Scaling
    print("\n--- Test 2: Percentage Scaling ---")
    c2 = Coupon.objects.create(code="SCALE_TEST", total_percentage=50)
    uc2 = UserCoupon.objects.create(user=user, coupon=c2, remaining_percentage=50)
    print(f"Initial: {uc2}")
    
    # Scale up: 50 -> 100 (Ratio 2)
    print("Scaling Coupon 50% -> 100%...")
    c2.total_percentage = 100
    c2.save()
    
    uc2.refresh_from_db()
    print(f"After Scale Up: {uc2}")
    if uc2.remaining_percentage == 100:
        print("SUCCESS: Scaled up correctly.")
    else:
        print(f"FAILURE: Expected 100, got {uc2.remaining_percentage}")

    # Scale down: 100 -> 25 (Ratio 0.25)
    print("Scaling Coupon 100% -> 25%...")
    c2.total_percentage = 25
    c2.save()
    
    uc2.refresh_from_db()
    print(f"After Scale Down: {uc2}")
    if uc2.remaining_percentage == 25:
        print("SUCCESS: Scaled down correctly.")
    else:
        print(f"FAILURE: Expected 25, got {uc2.remaining_percentage}")

    # Cleanup
    c1.delete()
    c2.delete()
    UserCoupon.objects.filter(user=user).delete()
    print("\nCleanup complete.")

if __name__ == "__main__":
    test_new_logic()
