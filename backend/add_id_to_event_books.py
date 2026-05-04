import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def add_id_to_event_books():
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'ls-7690623e8006d649d060877990666016f4945763.c966ogm6is8q.ap-southeast-1.rds.amazonaws.com'),
            user=os.getenv('DB_USER', 'dbmasteruser'),
            password=os.getenv('DB_PASSWORD', 'h#f9V5>|#&S{pS78v_f_t7f_H#f9V5'),
            database=os.getenv('DB_NAME', 'dbnovel')
        )
        cursor = conn.cursor()

        print("Checking for 'id' column in 'event_books'...")
        cursor.execute("SHOW COLUMNS FROM event_books LIKE 'id'")
        result = cursor.fetchone()

        if not result:
            print("Adding 'id' column to 'event_books'...")
            # We add 'id' as the first column and make it the Primary Key
            # Note: We might need to drop the old composite primary key if it exists
            try:
                cursor.execute("ALTER TABLE event_books DROP PRIMARY KEY")
            except:
                pass # Primary key might not exist or be different
                
            cursor.execute("ALTER TABLE event_books ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST")
            conn.commit()
            print("Successfully added 'id' column.")
        else:
            print("'id' column already exists.")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_id_to_event_books()
