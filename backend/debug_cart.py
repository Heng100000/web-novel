
import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from novels.models import AddToCart, Users
from novels.serializers import AddToCartSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

def test_serialization():
    # Get a user who has items in cart
    cart_items = AddToCart.objects.all()
    if not cart_items.exists():
        print("No cart items found.")
        return

    user = cart_items[0].user
    print(f"Testing for user: {user.email}")

    # Mock a request for the serializer (needed for some fields)
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = user

    items = AddToCart.objects.filter(user=user)
    print(f"Found {items.count()} items.")

    for item in items:
        try:
            print(f"Serializing item ID: {item.id}, Book: {item.book.title}")
            serializer = AddToCartSerializer(item, context={'request': request})
            data = serializer.data
            print("Successfully serialized.")
        except Exception as e:
            import traceback
            print(f"FAILED to serialize item {item.id}: {str(e)}")
            print(traceback.format_exc())

if __name__ == "__main__":
    test_serialization()
