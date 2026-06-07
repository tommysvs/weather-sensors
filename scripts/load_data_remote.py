import requests
from concurrent.futures import ThreadPoolExecutor
import time

urls = [
    "https://banknote-nineteen-security.ngrok-free.dev/api/weather/current?city=san-pedro-sula",
    "https://banknote-nineteen-security.ngrok-free.dev/api/weather/current?city=tegucigalpa"
]

def hit(i):
    url = urls[i % 2]
    try:
        r = requests.get(url, timeout=5)
        data = r.json()
        return f"Req {i} -> {data.get('city')} OK"
    except Exception as e:
        return f"Req {i} -> ERROR {e}"

counter = 1

while True:
    with ThreadPoolExecutor(max_workers=5) as executor:
        results = executor.map(hit, range(counter, counter + 20))

    for r in results:
        print(r)

    counter += 20
    time.sleep(1)