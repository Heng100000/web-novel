import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def check_users():
    with connection.cursor() as cursor:
        cursor.execute("DESCRIBE users;")
        for col in cursor.fetchall():
            if col[0] == 'id':
                print(f"ID Column: {col}")

        cursor.execute("DESCRIBE add_to_cart;")
        for col in cursor.fetchall():
            print(f"Add To Cart Column: {col}")

if __name__ == "__main__":
    check_users()