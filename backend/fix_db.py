import os
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def run_fix():
    with connection.cursor() as cursor:
        print("--- Inspecting Database Schema ---")
        try:
            cursor.execute("DESCRIBE users;")
            columns = cursor.fetchall()
            for col in columns:
                print(f"Column: {col[0]}, Type: {col[1]}")
        except Exception as e:
            print(f"Error inspecting 'users' table: {e}")

        print("\n--- Starting Database Fix ---")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        # ... rest of the logic
        
        tables = [
            "token_blacklist_blacklistedtoken",
            "token_blacklist_outstandingtoken"
        ]
        
        for table in tables:
            print(f"Dropping {table}...")
            cursor.execute(f"DROP TABLE IF EXISTS {table};")
            
        print("Cleaning migration history...")
        cursor.execute("DELETE FROM django_migrations WHERE app = 'token_blacklist';")
        
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        print("--- Fix Successful! ---")

if __name__ == "__main__":
    run_fix()
