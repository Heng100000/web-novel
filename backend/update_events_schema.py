import sqlite3
import os

db_path = 'db.sqlite3'

def update_schema():
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(events)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'discount_type' not in columns:
            print("Adding discount_type to events table...")
            cursor.execute("ALTER TABLE events ADD COLUMN discount_type VARCHAR(20) DEFAULT 'Percentage'")
        
        # We can use the existing discount_percentage field for the value
        # But if we want to be more specific, we can rename or add a new one.
        # Let's just add a new one to be safe and clear.
        if 'discount_value' not in columns:
            print("Adding discount_value to events table...")
            cursor.execute("ALTER TABLE events ADD COLUMN discount_value DECIMAL(10, 2) DEFAULT 0")
        
        # Populate discount_value from discount_percentage for existing records
        cursor.execute("UPDATE events SET discount_value = discount_percentage WHERE discount_value = 0 AND discount_percentage > 0")
        
        conn.commit()
        print("Schema updated successfully")
    except Exception as e:
        print(f"Error updating schema: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    update_schema()
