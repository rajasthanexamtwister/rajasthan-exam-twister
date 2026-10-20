import urllib.request
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://www.rajasthanexamtwister.in&strategy=mobile"

print("Fetching live PageSpeed Insights from Google API...")
try:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )
    with urllib.request.urlopen(req, timeout=60) as response:
        data = json.loads(response.read().decode("utf-8"))

    lighthouse = data.get("lighthouseResult", {})
    categories = lighthouse.get("categories", {})
    audits = lighthouse.get("audits", {})

    print("\n==========================================")
    print("🚀 GOOGLE PAGESPEED INSIGHTS (MOBILE)")
    print("==========================================")
    
    for cat_name, cat_data in categories.items():
        score = int((cat_data.get("score") or 0) * 100)
        print(f"📊 {cat_data.get('title', cat_name).upper()}: {score}/100")

    print("\n--- ⚡ CORE WEB VITALS & METRICS ---")
    metrics = [
        ("first-contentful-paint", "First Contentful Paint (FCP)"),
        ("largest-contentful-paint", "Largest Contentful Paint (LCP)"),
        ("total-blocking-time", "Total Blocking Time (TBT)"),
        ("cumulative-layout-shift", "Cumulative Layout Shift (CLS)"),
        ("speed-index", "Speed Index"),
    ]

    for key, name in metrics:
        audit = audits.get(key, {})
        val = audit.get("displayValue", "N/A")
        score = audit.get("score")
        status = "🟢" if score and score >= 0.9 else ("🟡" if score and score >= 0.5 else "🔴")
        print(f"{status} {name}: {val} (Score: {score})")

    print("\n--- ⚠️ TOP OPPORTUNITIES & DIAGNOSTICS ---")
    opp_keys = [
        "render-blocking-resources",
        "unused-javascript",
        "unused-css-rules",
        "modern-image-formats",
        "offscreen-images",
        "server-response-time",
        "uses-text-compression",
        "unminified-javascript",
        "unminified-css",
        "uses-long-cache-ttl"
    ]
    for key in opp_keys:
        audit = audits.get(key)
        if audit and audit.get("score") is not None and audit.get("score") < 0.9:
            disp = audit.get("displayValue", "")
            print(f"• {audit.get('title')}: {disp}")
            desc = audit.get("description", "")
            # print first sentence
            if desc:
                print(f"  Tip: {desc.split('. ')[0]}.")

except Exception as e:
    print(f"Error fetching PageSpeed data: {e}")
