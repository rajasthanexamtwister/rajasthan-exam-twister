import json
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Check MongoDB if pymongo is installed, or via a node script
def check():
    print("Checking database files and seeds...")
    cet_seeds = []
    for root, dirs, files in os.walk("."):
        if "node_modules" in root or ".next" in root or ".git" in root:
            continue
        for file in files:
            if file.endswith(".json") and ("cet" in file.lower() or "quiz" in file.lower()):
                full_path = os.path.join(root, file)
                cet_seeds.append(full_path)
    
    print(f"Found {len(cet_seeds)} relevant JSON files in project.")
    for f in cet_seeds[:10]:
        print(" -", f)

if __name__ == "__main__":
    check()
