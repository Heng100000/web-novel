import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

def add_reward_points():
    with connection.cursor() as cursor:
        try:
            # Check if column exists
            cursor.execute("SHOW COLUMNS FROM users LIKE 'reward_points'")
            if cursor.fetchone():
                print("Column 'reward_points' already exists in 'users' table.")
            else:
                print("Adding 'reward_points' column to 'users' table...")
                cursor.execute("ALTER TABLE users ADD COLUMN reward_points INT DEFAULT 0")
                print("Successfully added 'reward_points' column.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    add_reward_points()
