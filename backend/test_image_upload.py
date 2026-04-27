import requests
import os

def test_book_create():
    url = "http://127.0.0.1:8000/api/books/"
    
    # Create a dummy image
    image_path = "test_image.jpg"
    with open(image_path, "wb") as f:
        f.write(b"dummy image data")
        
    data = {
        "title": "Test Book Image",
        "price": "19.99",
        "category": "", # Optional
        "author": "", # Optional
        "edition_type": "Standard",
        "main_image_idx": "0"
    }
    
    files = [
        ("images", ("test_image.jpg", open(image_path, "rb"), "image/jpeg"))
    ]
    
    response = requests.post(url, data=data, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
    
    os.remove(image_path)

if __name__ == "__main__":
    try:
        test_book_create()
    except Exception as e:
        print(f"Error: {e}")
