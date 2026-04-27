import os
import django
from rest_framework.test import APIRequestFactory
from rest_framework import filters

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from novels.views import BookViewSet
from novels.models import Books

def test_search():
    factory = APIRequestFactory()
    view = BookViewSet.as_view({'get': 'list'})
    
    # Try searching for something that likely exists or just part of any title
    book = Books.objects.first()
    if not book:
        print("No books found in DB")
        return
        
    search_term = book.title[:3]
    print(f"Searching for: {search_term}")
    
    request = factory.get('/books/', {'search': search_term})
    response = view(request)
    
    print(f"Status Code: {response.status_code}")
    if hasattr(response, 'data'):
        results = response.data.get('results', [])
        print(f"Results found: {len(results)}")
        for r in results:
            print(f" - {r['title']}")
    else:
        print("No results in response data")

if __name__ == "__main__":
    test_search()
