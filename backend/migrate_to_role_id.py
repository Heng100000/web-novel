from django.db import connection
import os
import django

def migrate_to_role_id():
    with connection.cursor() as cursor:
        print("1. Adding role_id column to users table...")
        # Check if already exists to be safe
        cursor.execute("DESCRIBE users")
        columns = [col[0] for col in cursor.fetchall()]
        if 'role_id' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN role_id INT NULL AFTER role")
        else:
            print("role_id already exists, skipping ADD.")

        print("2. Mapping existing role names to role_id...")
        # Map Admin, Staff, Customer based on the roles table
        cursor.execute("SELECT id, name FROM roles")
        role_map = {name: id for id, name in cursor.fetchall()}
        print(f"Role lookup map: {role_map}")

        # Update each user
        cursor.execute("SELECT id, role FROM users")
        users = cursor.fetchall()
        for user_id, role_name in users:
            if role_name in role_map:
                rid = role_map[role_name]
                cursor.execute("UPDATE users SET role_id = %s WHERE id = %s", [rid, user_id])
                print(f"Updated User {user_id}: {role_name} -> ID {rid}")
            else:
                print(f"Warning: User {user_id} has unknown role '{role_name}'")

        print("3. Removing legacy role column...")
        if 'role' in columns:
            cursor.execute("ALTER TABLE users DROP COLUMN role")
            print("Column 'role' dropped successfully.")
        
        print("4. Migration to role_id completed successfully.")

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()
    migrate_to_role_id()
