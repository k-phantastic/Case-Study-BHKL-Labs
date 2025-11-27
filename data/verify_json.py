import json
import sys

try:
    with open('vaccination_data.json', 'r') as f:
        data = json.load(f)
    print("JSON is valid.")
    print(f"Keys: {list(data.keys())}")
    if "years" in data:
        print(f"Years: {data['years']}")
except json.JSONDecodeError as e:
    print(f"JSON Decode Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
