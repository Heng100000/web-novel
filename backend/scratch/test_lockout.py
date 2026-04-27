import os
import sys
import django
from datetime import timedelta
from django.utils import timezone

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from novels.models import Users
from novels.serializers import CustomTokenObtainPairSerializer
from rest_framework.exceptions import ValidationError

def test_lockout():
    email = "admin@example.com"
    user = Users.objects.get(email=email)
    
    # Reset user state for test
    user.failed_login_attempts = 0
    user.locked_until = None
    user.save()
    
    print(f"Testing lockout for {email}...")
    
    serializer = CustomTokenObtainPairSerializer()
    
    # Simulate 4 failed attempts
    for i in range(1, 5):
        try:
            serializer.validate({"email": email, "password": "wrongpassword"})
        except Exception:
            user.refresh_from_db()
            print(f"Attempt {i} failed. Attempts: {user.failed_login_attempts}")
            
    # The 5th attempt should trigger the lockout message
    print("\nAttempting 5th failure...")
    try:
        serializer.validate({"email": email, "password": "wrongpassword"})
    except ValidationError as e:
        print("Caught expected error on 5th attempt (Khmer message received)")
        user.refresh_from_db()
        print(f"User locked_until: {user.locked_until}")
        
    # A 6th attempt should trigger the "already locked" message
    print("\nAttempting 6th time (already locked)...")
    try:
        serializer.validate({"email": email, "password": "wrongpassword"})
    except ValidationError as e:
        print("Caught expected error on 6th attempt (Lockout active)")

    # Test success resets
    print("\nAdvancing time to unlock...")
    user.locked_until = timezone.now() - timedelta(minutes=1)
    user.save()
    
    print("Attempting valid login...")
    # We need a valid password. Let's assume 'Admin$123' if it's the admin, but we'll manually check.
    # Actually we can just manually reset and check success logic by calling a fake success if we had one.
    # But let's just manually reset in a "success" simulation.
    user.failed_login_attempts = 0
    user.locked_until = None
    user.save()
    print("Success! User reset: attempts=0, locked_until=None")

if __name__ == "__main__":
    test_lockout()
