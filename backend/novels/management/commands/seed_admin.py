from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from novels.models import Users


class Command(BaseCommand):
    help = 'Seeds an initial admin user'

    def handle(self, *args, **options):
        admin_email = 'admin@example.com'
        admin_password = 'Heng$1234$'
        
        if Users.objects.filter(email=admin_email).exists():
            self.stdout.write(self.style.WARNING(f'User {admin_email} already exists.'))
            return

        user = Users.objects.create(
            email=admin_email,
            role='Admin',
            full_name='System Administrator',
            phone='012345678',
            address='Office HQ'
        )
        user.set_password(admin_password)
        user.save()
        
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded admin user: {admin_email}'))
