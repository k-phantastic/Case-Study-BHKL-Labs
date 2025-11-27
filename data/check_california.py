import json

with open('vaccination_data.json', 'r') as f:
    data = json.load(f)

# Check for California (FIPS 6)
# Try both "6" and "06"
print("Checking for California (FIPS 6)...")
if "6" in data["states"]:
    print("Found key '6':")
    print(json.dumps(data["states"]["6"], indent=2))
else:
    print("Key '6' not found.")

if "06" in data["states"]:
    print("Found key '06':")
    print(json.dumps(data["states"]["06"], indent=2))
else:
    print("Key '06' not found.")
