import os
import sys
import django
from decimal import Decimal

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from novels.models import Books, Events, EventBooks

from django.db import connection

books = Books.objects.all()
for book in books:
    print(f"ID: {book.id} | Price: ${book.price}")
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT e.id, e.title, e.discount_percentage, e.discount_type, e.discount_value, e.status 
            FROM events e
            JOIN event_books eb ON e.id = eb.event_id
            WHERE eb.book_id = %s
        """, [book.id])
        rows = cursor.fetchall()
        for row in rows:
            ev_id, ev_title, disc_pct, d_type, d_val, stat = row
            print(f"  Event: {ev_title} (ID: {ev_id}) | Status: {stat}")
            print(f"  Pct: {disc_pct} | Val: {d_val} | Type: {d_type}")
        if not rows:
            print("  No event.")
