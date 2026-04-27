import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def update_schema():
    with connection.cursor() as cursor:
        table_name = 'books'
        
        # Check and add price_riel
        cursor.execute(f"SHOW COLUMNS FROM {table_name} LIKE 'price_riel'")
        if not cursor.fetchone():
            print("Adding price_riel to books...")
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN price_riel DECIMAL(12, 2) DEFAULT 0")
        
        # Migration: If price exists but price_riel is 0, we can estimate with 4000៛/1$
        cursor.execute("UPDATE books SET price_riel = price * 4000 WHERE price_riel = 0 AND price > 0")
        
        print("Schema update completed successfully.")

if __name__ == "__main__":
    update_schema()
