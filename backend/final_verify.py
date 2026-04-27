import urllib.request
import json

def verify_final():
    url = 'http://127.0.0.1:8000/api/auth/login/'
    # The true password
    password = 'Heng$1234$'
    data = {'email': 'admin@example.com', 'password': password}
    
    encoded_data = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=encoded_data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.getcode()}")
            # Check if role is Admin
            body = json.loads(response.read().decode())
            print(f"Role in response: {body['user']['role']}")
    except Exception as e:
        print(f"Final Verification Failed: {str(e)}")

if __name__ == "__main__":
    verify_final()
