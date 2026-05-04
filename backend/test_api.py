import http.client
import json

conn = http.client.HTTPConnection("127.0.0.1", 8000)
conn.request("GET", "/api/categories/")
response = conn.getresponse()
print(f"Status: {response.status}")
data = response.read().decode()
try:
    print(json.dumps(json.loads(data), indent=2))
except:
    print(data)
conn.close()
