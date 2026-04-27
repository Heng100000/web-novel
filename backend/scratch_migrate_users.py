from django.db import connection

def migrate():
    with connection.cursor() as cursor:
        print("Altering table users...")
        cursor.execute('ALTER TABLE users MODIFY role VARCHAR(50)')
        
        print("Updating admin roles...")
        cursor.execute("UPDATE users SET role = 'Admin' WHERE role = 'admin'")
        
        print("Updating customer roles...")
        cursor.execute("UPDATE users SET role = 'Customer' WHERE role = 'customer'")
        
        print("Migration successful")

if __name__ == "__main__":
    import os
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()
    migrate()
