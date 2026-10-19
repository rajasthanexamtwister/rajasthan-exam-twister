import json
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

data_file = os.path.abspath("public/uploads/social_posts_history.json")
with open(data_file, "r", encoding="utf-8") as f:
    history = json.load(f)

print(f"Total history items: {len(history)}")
posted = [x for x in history if x.get("status", {}).get("instagramUploaded")]
pending = [x for x in history if not x.get("status", {}).get("instagramUploaded")]

print(f"Posted count: {len(posted)}")
for p in posted:
    print(f"  - Q{p['questionNumber']} (Seq #{p.get('uploadSequence')}): {p['questionHi'][:40]}")

print(f"\nPending count: {len(pending)}")
for p in pending:
    print(f"  - Q{p['questionNumber']}: {p['questionHi'][:40]} -> {p['instagramImageUrl']}")
