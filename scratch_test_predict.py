import io
import requests
from PIL import Image

img = Image.new('RGB', (100, 100), color='green')
buf = io.BytesIO()
img.save(buf, format='JPEG')
buf.seek(0)

try:
    res = requests.post(
        'http://127.0.0.1:8000/api/waste/predict',
        files={'file': ('test.jpg', buf, 'image/jpeg')}
    )
    print("STATUS:", res.status_code)
    print("RESPONSE:", res.text)
except Exception as e:
    print("ERROR:", e)
