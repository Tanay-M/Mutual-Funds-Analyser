from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

def test_search():
    print("\n--- Testing /search ---")
    response = client.get("/search?q=Quant&filter=Direct Growth")
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Found {len(data)} funds.")
        if data:
            print(f"Sample: {data[0]}")
    else:
        print(f"Failed: {response.status_code} - {response.text}")

def test_compare():
    print("\n--- Testing /compare with Benchmark 8% ---")
    # Using PPFAS (122639) as a known good ID
    response = client.get("/compare?codes=122639&years=3&benchmark=0.08")
    if response.status_code == 200:
        data = response.json()
        print("Success! Data received.")
        if "122639" in data:
            fund_data = data["122639"]
            print(f"Benchmark Used: {fund_data.get('benchmark_used')}")
            probs = fund_data.get("probabilities", {})
            print(f"Prob > Benchmark (8%): {probs.get('beat_benchmark'):.2%}")
    else:
        print(f"Failed: {response.status_code} - {response.text}")

def test_compare_validation():
    print("\n--- Testing Validation ---")
    response = client.get("/compare?codes=122639&years=0.1")
    print(f"Status for years=0.1: {response.status_code} (Expected 400)")

if __name__ == "__main__":
    test_search()
    test_compare()
    test_compare_validation()
