import MySQLdb

def update_schema():
    db = MySQLdb.connect(
        host="database-1.c3qoc0ocktbm.ap-southeast-1.rds.amazonaws.com",
        user="admin_novel",
        passwd="novel$$1234$$",
        db="book_db",
        port=3306,
        charset='utf8mb4'
    )
    cursor = db.cursor()

    try:
        # Update events table
        print("Checking events table...")
        cursor.execute("DESCRIBE events")
        columns = [row[0] for row in cursor.fetchall()]
        
        if 'event_type' not in columns:
            print("Adding event_type to events table...")
            cursor.execute("ALTER TABLE events ADD COLUMN event_type VARCHAR(20) DEFAULT 'Promotion'")
        
        if 'discount_type' not in columns:
            print("Adding discount_type to events table...")
            cursor.execute("ALTER TABLE events ADD COLUMN discount_type VARCHAR(20) DEFAULT 'Percentage'")
            
        if 'discount_value' not in columns:
            print("Adding discount_value to events table...")
            cursor.execute("ALTER TABLE events ADD COLUMN discount_value DECIMAL(10, 2) DEFAULT 0")

        # Update event_books table
        print("Checking event_books table...")
        cursor.execute("DESCRIBE event_books")
        eb_columns = [row[0] for row in cursor.fetchall()]
        
        if 'flash_sale_qty' not in eb_columns:
            print("Adding flash_sale_qty to event_books table...")
            cursor.execute("ALTER TABLE event_books ADD COLUMN flash_sale_qty INT DEFAULT 0")
            
        if 'items_sold' not in eb_columns:
            print("Adding items_sold to event_books table...")
            cursor.execute("ALTER TABLE event_books ADD COLUMN items_sold INT DEFAULT 0")
        
        db.commit()
        print("MySQL Flash Sale columns added successfully")
    except Exception as e:
        print(f"Error updating MySQL schema: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_schema()
