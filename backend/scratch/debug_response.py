import os
import sys
import django
from django.utils import timezone
from datetime import timedelta

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from novels.models import Users
from novels.serializers import CustomTokenObtainPairSerializer

def debug_lockout_response():
    email = "admin@example.com"
    user = Users.objects.get(email=email)
    
    # Force a lockout state
    user.failed_login_attempts = 5
    user.locked_until = timezone.now() + timedelta(minutes=5)
    user.save()
    
    print(f"DEBUG: User {email} set to locked until {user.locked_until}")
    
    serializer = CustomTokenObtainPairSerializer()
    try:
        serializer.validate({"email": email, "password": "wrong"})
    except Exception as e:
        print("\n--- Serializer Error Data ---")
        if hasattr(e, 'detail'):
            print(f"e.detail (repr): {repr(e.detail)}")
            print(f"type(e.detail): {type(e.detail)}")
        else:
            print(f"Exception message: {str(e)}")

if __name__ == "__main__":
    debug_lockout_response()
