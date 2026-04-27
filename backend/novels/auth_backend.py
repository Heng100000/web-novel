from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from .models import Users


class ExistingUsersBackend(BaseBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        with open("debug_auth.log", "a") as f:
            username = kwargs.get('username') or email
            f.write(f"--- ATTEMPT: {username} ---\n")
            if password:
                import binascii
                pwd_hex = binascii.hexlify(password.encode('utf-8')).decode()
                f.write(f"DEBUG: Password Hex: {pwd_hex}\n")
            
            if not username or not password:
                return None

            try:
                user = Users.objects.get(email__iexact=username)
                
                # Check if locked
                from django.utils import timezone
                if user.locked_until and user.locked_until > timezone.now():
                    f.write(f"DEBUG: Account locked until {user.locked_until}\n")
                    return None

                match = user.check_password(password)
                f.write(f"DEBUG: Match: {match}\n")
                
                if match:
                    # Success: Reset attempts
                    if user.failed_login_attempts > 0 or user.locked_until:
                        user.failed_login_attempts = 0
                        user.locked_until = None
                        user.save()
                    return user
                else:
                    # Failure: Increment attempts
                    user.failed_login_attempts += 1
                    if user.failed_login_attempts >= 5:
                        user.locked_until = timezone.now() + timezone.timedelta(minutes=5)
                        f.write("DEBUG: Account LOCK TRIGGERED\n")
                    user.save()
                    return None

            except Users.DoesNotExist:
                f.write("DEBUG: User not found\n")
                return None
            return None

    def get_user(self, user_id):
        try:
            return Users.objects.get(pk=user_id)
        except Users.DoesNotExist:
            return None
