import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def add_id_to_event_books():
    try:
        with connection.cursor() as cursor:
            print("Checking for 'id' column in 'event_books'...")
            cursor.execute("SHOW COLUMNS FROM event_books LIKE 'id'")
            result = cursor.fetchone()

            if not result:
                print("Attempting to add 'id' column with UNIQUE constraint...")
                # We add it as a UNIQUE column to avoid PK conflicts while satisfying Django's need for an 'id'
                try:
                    cursor.execute("ALTER TABLE event_books ADD COLUMN id INT AUTO_INCREMENT UNIQUE FIRST")
                    print("Successfully added 'id' column as UNIQUE.")
                except Exception as e:
                    print(f"Error adding column: {e}")
            else:
                print("'id' column already exists.")
    except Exception as e:
        print(f"General Error: {e}")

if __name__ == "__main__":
    add_id_to_event_books()
