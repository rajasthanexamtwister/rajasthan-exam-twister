import json
import os
import sys
import io
from datetime import datetime, timezone

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DATA_FILE = os.path.abspath("public/uploads/social_posts_history.json")
KITS_DIR = os.path.abspath("public/uploads/social-kits/rajasthan-cet-sr-secondary/2024")

def mark_11_posted():
    print(f"Reading history from: {DATA_FILE}")
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        history = json.load(f)

    now_iso = datetime.now(timezone.utc).isoformat()
    updated_posted = 0
    updated_pending = 0

    for item in history:
        q_num = item.get("questionNumber")
        # Exact integer check: 1 to 11
        if q_num is not None and 1 <= int(q_num) <= 11:
            if "status" not in item or not item["status"]:
                item["status"] = {
                    "instagramUploaded": False,
                    "instagramUploadedAt": None,
                    "twitterPosted": False,
                    "twitterPostedAt": None,
                }
            item["status"]["instagramUploaded"] = True
            item["status"]["instagramUploadedAt"] = now_iso
            item["uploadSequence"] = int(q_num)
            updated_posted += 1
            print(f"✅ MARKED POSTED: Q{q_num} ({item.get('id')})")
        else:
            # Questions 12, 13, 14, 15 MUST BE PENDING
            if "status" not in item or not item["status"]:
                item["status"] = {
                    "instagramUploaded": False,
                    "instagramUploadedAt": None,
                    "twitterPosted": False,
                    "twitterPostedAt": None,
                }
            item["status"]["instagramUploaded"] = False
            item["status"]["instagramUploadedAt"] = None
            if "uploadSequence" in item:
                del item["uploadSequence"]
            updated_pending += 1
            print(f"⏳ REMAINING PENDING: Q{q_num} ({item.get('id')})")

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print(f"\nSaved history: {updated_posted} marked posted, {updated_pending} remain pending.")

    # Update individual kit.json files
    # Q1 to Q11 -> posted
    for i in range(1, 12):
        kit_file = os.path.join(KITS_DIR, f"question-{i}", "kit.json")
        if os.path.exists(kit_file):
            with open(kit_file, "r", encoding="utf-8") as f:
                kit_data = json.load(f)
            if "status" not in kit_data or not kit_data["status"]:
                kit_data["status"] = {
                    "instagramUploaded": False,
                    "instagramUploadedAt": None,
                    "twitterPosted": False,
                    "twitterPostedAt": None,
                }
            kit_data["status"]["instagramUploaded"] = True
            kit_data["status"]["instagramUploadedAt"] = now_iso
            kit_data["uploadSequence"] = i
            with open(kit_file, "w", encoding="utf-8") as f:
                json.dump(kit_data, f, ensure_ascii=False, indent=2)
            print(f"Updated kit.json: question-{i} -> POSTED")

    # Q12 to Q15 -> pending
    for i in range(12, 16):
        kit_file = os.path.join(KITS_DIR, f"question-{i}", "kit.json")
        if os.path.exists(kit_file):
            with open(kit_file, "r", encoding="utf-8") as f:
                kit_data = json.load(f)
            if "status" not in kit_data or not kit_data["status"]:
                kit_data["status"] = {
                    "instagramUploaded": False,
                    "instagramUploadedAt": None,
                    "twitterPosted": False,
                    "twitterPostedAt": None,
                }
            kit_data["status"]["instagramUploaded"] = False
            kit_data["status"]["instagramUploadedAt"] = None
            if "uploadSequence" in kit_data:
                del kit_data["uploadSequence"]
            with open(kit_file, "w", encoding="utf-8") as f:
                json.dump(kit_data, f, ensure_ascii=False, indent=2)
            print(f"Updated kit.json: question-{i} -> PENDING")

    # Print summary of remaining pending questions
    pending = [x for x in history if not x.get("status", {}).get("instagramUploaded")]
    uploaded = [x for x in history if x.get("status", {}).get("instagramUploaded")]
    print(f"\n==========================================")
    print(f"📊 TOTAL QUESTIONS IN SYSTEM: {len(history)}")
    print(f"✅ ALREADY POSTED ON INSTAGRAM: {len(uploaded)} (Q1 to Q11)")
    print(f"⏳ REMAINING IN PENDING QUEUE: {len(pending)} (Q12, Q13, Q14, Q15)")
    print(f"🎯 NEXT QUESTION READY TO POST: Q{pending[0].get('questionNumber')} - {pending[0].get('questionHi')}")
    print(f"==========================================")

if __name__ == "__main__":
    mark_11_posted()
