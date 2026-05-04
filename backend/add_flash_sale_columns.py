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
        # Update events table
        cursor.execute("PRAGMA table_info(events)")
        event_columns = [row[1] for row in cursor.fetchall()]
        
        if 'event_type' not in event_columns:
            print("Adding event_type to events table...")
            cursor.execute("ALTER TABLE events ADD COLUMN event_type VARCHAR(20) DEFAULT 'Promotion'")
        
        # Update event_books table
        cursor.execute("PRAGMA table_info(event_books)")
        eb_columns = [row[1] for row in cursor.fetchall()]
        
        if 'flash_sale_qty' not in eb_columns:
            print("Adding flash_sale_qty to event_books table...")
            cursor.execute("ALTER TABLE event_books ADD COLUMN flash_sale_qty INTEGER DEFAULT 0")
            
        if 'items_sold' not in eb_columns:
            print("Adding items_sold to event_books table...")
            cursor.execute("ALTER TABLE event_books ADD COLUMN items_sold INTEGER DEFAULT 0")
        
        conn.commit()
        print("Flash Sale columns added successfully")
    except Exception as e:
        print(f"Error updating schema: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    update_schema()
