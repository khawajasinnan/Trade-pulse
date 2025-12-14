#!/usr/bin/env python3

modules = [
    'numpy',
    'pandas',
    'psycopg2',
    'sklearn',
    'tensorflow',
    'torch',
    'transformers'
]

failed = []

for mod in modules:
    try:
        __import__(mod)
        print(f"OK: {mod}")
    except Exception as e:
        print(f"MISSING: {mod} -> {e}")
        failed.append((mod, str(e)))

if not failed:
    print("\nAll required modules are installed.")
else:
    print("\nSome modules are missing or failed to import. Install requirements with: pip install -r requirements.txt")
    for mod, err in failed:
        print(f" - {mod}: {err}")
