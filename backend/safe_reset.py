import django
import os

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from novels.models import Users

def safe_reset():
    email = 'admin@example.com'
    # The password must be EXACTLY what the user types in the browser
    password = 'Heng' + '$' + '1234' + '$' 
    # Actually, a single string 'Heng$1234$' is safer in Python code
    password = 'Heng' + chr(36) + '1234' + chr(36) # Absolute safety
    # Wait, the screenshot showed Heng$1234$ (no trailing $)
    password = 'Heng$1234$'
    
    print(f"--- Safe Resetting User {email} ---")
    try:
        user = Users.objects.get(email=email)
        user.set_password(password)
        user.role = 'Admin' # Ensure Capital A for frontend check
        user.save()
        print(f"Password set and Role set to '{user.role}'")
        
        from django.contrib.auth import authenticate
        auth_user = authenticate(email=email, password=password)
        print(f"Internal authentication check: {'Passed' if auth_user else 'Failed'}")
        
    except Users.DoesNotExist:
        print(f"User {email} not found!")

if __name__ == "__main__":
    safe_reset()
