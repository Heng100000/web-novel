import os
import django
from django.urls import get_resolver

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def list_urls():
    resolver = get_resolver()
    for url in resolver.url_patterns:
        print(url)
        if hasattr(url, 'url_patterns'):
            for sub_url in url.url_patterns:
                print(f"  {sub_url}")

if __name__ == "__main__":
    list_urls()
