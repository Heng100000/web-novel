import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def update_schema():
    with connection.cursor() as cursor:
        table_name = 'events'
        
        # Check and add discount_type
        cursor.execute(f"SHOW COLUMNS FROM {table_name} LIKE 'discount_type'")
        if not cursor.fetchone():
            print("Adding discount_type to events...")
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN discount_type VARCHAR(20) DEFAULT 'Percentage'")
        
        # Check and add discount_value
        cursor.execute(f"SHOW COLUMNS FROM {table_name} LIKE 'discount_value'")
        if not cursor.fetchone():
            print("Adding discount_value to events...")
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN discount_value DECIMAL(10, 2) DEFAULT 0")
        
        # Migration: Copy discount_percentage to discount_value if not already set
        cursor.execute("UPDATE events SET discount_value = discount_percentage WHERE discount_value = 0 AND discount_percentage > 0")
        
        print("Schema update completed successfully.")

if __name__ == "__main__":
    update_schema()
