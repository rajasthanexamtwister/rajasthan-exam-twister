import os
import sys
import json
import time
import subprocess
from pathlib import Path
from PIL import Image

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent
SOCIAL_KITS_DIR = BASE_DIR / "public" / "uploads" / "social-kits"
HISTORY_FILE = BASE_DIR / "public" / "uploads" / "social_posts_history.json"

def get_browser_path():
    candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return "msedge"

def generate_social_kit(
    exam_name="Rajasthan CET (Sr. Secondary)",
    year="2024",
    question_num=1,
    subject="सामान्य हिंदी",
    topic="संज्ञा व सर्वनाम",
    question_hi="‘उसने कुछ नहीं खाया’ इसमें ‘कुछ’ कौन-सा सर्वनाम है?",
    question_en="In 'उसने कुछ नहीं खाया', which pronoun is 'कुछ'?",
    options=None,
    correct_option="D",
    explanation="‘कुछ’ एक अनिश्चयवाचक सर्वनाम है क्योंकि इससे किसी निश्चित वस्तु या मात्रा का बोध नहीं होता।",
    exam_badge="CET Senior Secondary 2024 का महत्वपूर्ण सवाल",
    subject_badge="GENERAL HINDI | सामान्य हिंदी"
):
    if options is None:
        options = [
            {"key": "A", "hi": "प्रश्नवाचक", "en": "Prashnavachak"},
            {"key": "B", "hi": "संबंधवाचक", "en": "Sambandhvachak"},
            {"key": "C", "hi": "निजवाचक", "en": "Nijvachak"},
            {"key": "D", "hi": "अनिश्चयवाचक", "en": "Anishchayvachak"}
        ]

    # Normalize exam slug
    exam_slug = exam_name.lower().replace(" ", "-").replace("(", "").replace(")", "").replace(".", "")
    kit_dir = SOCIAL_KITS_DIR / exam_slug / str(year) / f"question-{question_num}"
    kit_dir.mkdir(parents=True, exist_ok=True)

    reel_img_path = kit_dir / "reel_9_16.jpg"
    twitter_img_path = kit_dir / "twitter_card.jpg"
    kit_json_path = kit_dir / "kit.json"

    # 1. Render 1080x1920 HTML Template
    html_content = f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920, initial-scale=1.0">
    <title>Social Kit Reel</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700;800;900&family=Poppins:wght@500;700;800;900&display=swap" rel="stylesheet">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            width: 1080px;
            height: 1920px;
            overflow: hidden;
            font-family: 'Mukta', sans-serif;
            background: linear-gradient(180deg, #071322 0%, #0F233D 30%, #0B192C 70%, #050B14 100%);
            color: #ffffff;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 70px 65px 50px 65px;
        }}
        .bg-glow {{
            position: absolute;
            top: -100px;
            left: 50%;
            transform: translateX(-50%);
            width: 1000px;
            height: 800px;
            background: radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0) 70%);
            z-index: 1;
            pointer-events: none;
        }}
        .header-row {{
            position: relative;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 28px;
            background: rgba(15, 23, 42, 0.75);
            border: 2px solid rgba(245, 158, 11, 0.3);
            border-radius: 28px;
            padding: 24px 32px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.5);
            backdrop-filter: blur(10px);
        }}
        .brand-logo-box {{
            width: 110px;
            height: 110px;
            border-radius: 24px;
            background: linear-gradient(135deg, #1E293B, #0F172A);
            border: 3px solid #F59E0B;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
            flex-shrink: 0;
        }}
        .brand-logo-box img {{
            width: 100%;
            height: 100%;
            object-fit: contain;
        }}
        .header-meta {{
            display: flex;
            flex-direction: column;
            gap: 6px;
        }}
        .tagline-top {{
            font-family: 'Poppins', sans-serif;
            font-size: 19px;
            font-weight: 800;
            letter-spacing: 3px;
            color: #F59E0B;
            text-transform: uppercase;
        }}
        .subject-title {{
            font-size: 42px;
            font-weight: 900;
            line-height: 1.1;
            color: #FFFFFF;
            letter-spacing: 0.5px;
        }}
        .sub-pill {{
            font-family: 'Poppins', sans-serif;
            font-size: 18px;
            font-weight: 700;
            color: #94A3B8;
            letter-spacing: 1px;
        }}
        .center-wrap {{
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            gap: 28px;
            margin: auto 0;
        }}
        .exam-ribbon {{
            align-self: flex-start;
            background: linear-gradient(90deg, #F59E0B 0%, #D97706 100%);
            color: #0F172A;
            font-size: 26px;
            font-weight: 900;
            padding: 10px 28px;
            border-radius: 50px;
            box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4);
            letter-spacing: 0.5px;
            border: 2px solid #FDE68A;
        }}
        .question-card {{
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
            border: 3px solid rgba(245, 158, 11, 0.5);
            border-radius: 32px;
            padding: 40px 42px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.6);
            position: relative;
        }}
        .q-badge {{
            position: absolute;
            top: -24px;
            left: 36px;
            background: #F59E0B;
            color: #0B132B;
            font-family: 'Poppins', sans-serif;
            font-size: 24px;
            font-weight: 900;
            padding: 4px 22px;
            border-radius: 14px;
            box-shadow: 0 6px 15px rgba(245, 158, 11, 0.4);
        }}
        .q-text-hi {{
            font-size: 46px;
            font-weight: 800;
            line-height: 1.35;
            color: #F8FAFC;
            margin-top: 5px;
        }}
        .q-text-en {{
            font-family: 'Poppins', sans-serif;
            font-size: 25px;
            font-weight: 600;
            color: #94A3B8;
            margin-top: 14px;
            line-height: 1.4;
        }}
        .options-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 22px;
        }}
        .opt-card {{
            background: rgba(15, 23, 42, 0.85);
            border: 2px solid rgba(148, 163, 184, 0.25);
            border-radius: 24px;
            padding: 24px 26px;
            display: flex;
            align-items: center;
            gap: 20px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.35);
        }}
        .opt-letter {{
            width: 60px;
            height: 60px;
            border-radius: 18px;
            background: linear-gradient(135deg, #F59E0B, #D97706);
            color: #0F172A;
            font-family: 'Poppins', sans-serif;
            font-size: 30px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 6px 15px rgba(245, 158, 11, 0.35);
        }}
        .opt-texts {{
            display: flex;
            flex-direction: column;
            gap: 2px;
        }}
        .opt-hi {{
            font-size: 34px;
            font-weight: 800;
            color: #F8FAFC;
            line-height: 1.2;
        }}
        .opt-en {{
            font-family: 'Poppins', sans-serif;
            font-size: 20px;
            font-weight: 600;
            color: #94A3B8;
        }}
        .challenge-pill {{
            background: linear-gradient(90deg, #7F1D1D 0%, #991B1B 50%, #7F1D1D 100%);
            border: 2px solid #EF4444;
            border-radius: 20px;
            padding: 16px 24px;
            text-align: center;
            font-size: 28px;
            font-weight: 800;
            color: #FEF2F2;
            box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
            letter-spacing: 0.5px;
        }}
        .features-ribbon {{
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(245, 158, 11, 0.2);
            border-radius: 18px;
            padding: 18px 24px;
            display: flex;
            justify-content: space-around;
            font-size: 22px;
            font-weight: 700;
            color: #F1F5F9;
            box-shadow: 0 8px 20px rgba(0,0,0,0.35);
        }}
        .bottom-wrap {{
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            gap: 18px;
        }}
        .slogan-banner {{
            background: linear-gradient(90deg, #F59E0B 0%, #FDE68A 50%, #F59E0B 100%);
            border: 3px solid #B45309;
            border-radius: 22px;
            padding: 20px 24px;
            text-align: center;
            color: #0F172A;
            box-shadow: 0 15px 35px rgba(245, 158, 11, 0.5);
        }}
        .slogan-title {{
            font-size: 40px;
            font-weight: 900;
            line-height: 1.15;
            letter-spacing: 0.5px;
        }}
        .slogan-sub {{
            font-family: 'Poppins', sans-serif;
            font-size: 25px;
            font-weight: 800;
            letter-spacing: 2px;
            color: #1E293B;
        }}
        .hashtag-bar {{
            text-align: center;
            font-family: 'Poppins', sans-serif;
            font-size: 20px;
            font-weight: 600;
            color: #94A3B8;
            letter-spacing: 1px;
        }}
    </style>
</head>
<body>
    <div class="bg-glow"></div>

    <div class="header-row">
        <div class="brand-logo-box">
            <img src="http://localhost:3000/brand/examtwister_logo.png" alt="Logo">
        </div>
        <div class="header-meta">
            <div class="tagline-top">LEARN • PRACTICE • SUCCEED</div>
            <div class="subject-title">{subject_badge}</div>
            <div class="sub-pill">FOR CET | REET | LDC | SI | PATWAR</div>
        </div>
    </div>

    <div class="center-wrap">
        <div class="exam-ribbon">{exam_badge}</div>

        <div class="question-card">
            <div class="q-badge">Q.{question_num}</div>
            <div class="q-text-hi">{question_hi}</div>
            <div class="q-text-en">({question_en})</div>
        </div>

        <div class="options-grid">
            <div class="opt-card">
                <div class="opt-letter">A</div>
                <div class="opt-texts">
                    <div class="opt-hi">{options[0]['hi']}</div>
                    <div class="opt-en">{options[0]['en']}</div>
                </div>
            </div>
            <div class="opt-card">
                <div class="opt-letter">B</div>
                <div class="opt-texts">
                    <div class="opt-hi">{options[1]['hi']}</div>
                    <div class="opt-en">{options[1]['en']}</div>
                </div>
            </div>
            <div class="opt-card">
                <div class="opt-letter">C</div>
                <div class="opt-texts">
                    <div class="opt-hi">{options[2]['hi']}</div>
                    <div class="opt-en">{options[2]['en']}</div>
                </div>
            </div>
            <div class="opt-card">
                <div class="opt-letter">D</div>
                <div class="opt-texts">
                    <div class="opt-hi">{options[3]['hi']}</div>
                    <div class="opt-en">{options[3]['en']}</div>
                </div>
            </div>
        </div>

        <div class="challenge-pill">
            🔥 90% लोग गलत उत्तर देते हैं! बिना Google किए A/B/C/D बताओ! 🎯
        </div>

        <div class="features-ribbon">
            <span>📖 STUDY SMARTER</span>
            <span>💡 PRACTICE REGULARLY</span>
            <span>📈 IMPROVE EVERYDAY</span>
            <span>🏆 CRACK EXAMS</span>
        </div>
    </div>

    <div class="bottom-wrap">
        <div class="slogan-banner">
            <div class="slogan-title">सवाल सीधा नहीं, सोच टेढ़ी करो!</div>
            <div class="slogan-sub">RAJASTHAN EXAM TWISTER</div>
        </div>
        <div class="hashtag-bar">
            #RajasthanGK  #RajasthanCET  #CET2024  #HindiGrammar  #RSSB  #REET  #ExamTwister
        </div>
    </div>
</body>
</html>"""

    temp_html = kit_dir / "temp_render.html"
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    browser = get_browser_path()
    cmd = [
        browser,
        "--headless",
        "--disable-gpu",
        "--force-device-scale-factor=1",
        "--window-size=1080,1920",
        f"--screenshot={str(reel_img_path)}",
        f"file:///{str(temp_html.resolve())}"
    ]
    subprocess.run(cmd, check=True)
    print(f"✅ Reel 9:16 generated: {reel_img_path}")

    # Generate Twitter card crop
    im = Image.open(reel_img_path)
    w, h = im.size
    crop_top = int(h * 0.18)
    crop_bottom = int(h * 0.82)
    cropped = im.crop((0, crop_top, w, crop_bottom))
    cropped.save(twitter_img_path, quality=95)
    print(f"✅ Twitter Card generated: {twitter_img_path}")

    if os.path.exists(temp_html):
        os.remove(temp_html)

    # 2. Build Structured Metadata & Captions
    correct_opt_obj = next((o for o in options if o["key"] == correct_option), options[0])
    
    instagram_caption = f"""🔥 राजस्थान CET & प्रतियोगी परीक्षाओं का महत्वपूर्ण सवाल! 🎯

📖 विषय: {subject} ({topic})
❓ प्रश्न: {question_hi}
({question_en})

विकल्प:
(A) {options[0]['hi']}
(B) {options[1]['hi']}
(C) {options[2]['hi']}
(D) {options[3]['hi']}

👇 अपना उत्तर तुरंत कमेंट में A, B, C या D लिखें!
(सही उत्तर व व्याख्या Pinned Comment में देखें 📌)

🔔 रोज़ाना ऐसे ही उच्च-स्तरीय प्रश्नों और मास्टर नोट्स के लिए फॉलो करें: @rajasthanexamtwister
🌐 फ्री टेस्ट व पीडीएफ नोट्स: rajasthanexamtwister.in

#RajasthanCET #CET2024 #RajasthanGK #HindiGrammar #REET #LDC #Patwar #RSSB #RPSC #ExamTwister #StudyWithTwister"""

    pinned_comment = f"""✅ सही उत्तर: विकल्प ({correct_option}) {correct_opt_obj['hi']}

📌 व्याख्या (Explanation):
{explanation}

💡 ऐसे ही विषयवार उच्च स्तरीय क्विज़ और नोट्स के लिए हमारे प्रोफाइल बायो में दिए गए लिंक से फ्री में अभ्यास करें! 🏆"""

    tweet_text = f"""🎯 {exam_name} {year} | {subject}

Q. {question_hi}
({question_en})

(A) {options[0]['hi']}
(B) {options[1]['hi']}
(C) {options[2]['hi']}
(D) {options[3]['hi']}

सही उत्तर कमेंट में बताएं! 👇
व्याख्या व फ्री टेस्ट: https://rajasthanexamtwister.in

#RajasthanCET #CET2024 #RajasthanGK #RSSB"""

    suggested_songs = [
        {"title": "Aarambh Hai Prachand", "mood": "High Energy Motivation", "tag": "trending-exam"},
        {"title": "Kesariya Balam (Folk Beats)", "mood": "Rajasthani Cultural Pride", "tag": "viral-rajasthan"},
        {"title": "Kar Har Maidan Fateh", "mood": "Aspirant Inspiration", "tag": "study-grind"},
        {"title": "Lakshya Toh Har Haal Mein Paana Hai", "mood": "Laser Focus", "tag": "exam-focus"}
    ]

    kit_data = {
        "id": f"{exam_slug}-{year}-q{question_num}",
        "exam": exam_name,
        "year": str(year),
        "questionNumber": question_num,
        "subject": subject,
        "topic": topic,
        "questionHi": question_hi,
        "questionEn": question_en,
        "options": options,
        "correctOption": correct_option,
        "explanation": explanation,
        "relativePaths": {
            "reelImage": f"/uploads/social-kits/{exam_slug}/{year}/question-{question_num}/reel_9_16.jpg",
            "twitterImage": f"/uploads/social-kits/{exam_slug}/{year}/question-{question_num}/twitter_card.jpg",
            "kitJson": f"/uploads/social-kits/{exam_slug}/{year}/question-{question_num}/kit.json"
        },
        "instagramCaption": instagram_caption,
        "pinnedComment": pinned_comment,
        "suggestedSongs": suggested_songs,
        "tweetText": tweet_text,
        "status": {
            "instagramUploaded": False,
            "instagramUploadedAt": None,
            "twitterPosted": False,
            "twitterPostedAt": None
        },
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    with open(kit_json_path, "w", encoding="utf-8") as f:
        json.dump(kit_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Kit JSON saved: {kit_json_path}")

    # 3. Update Social Posts History for Admin Studio
    history_item = {
        "id": kit_data["id"],
        "date": time.strftime("%Y-%m-%d"),
        "examName": f"{exam_name} {year}",
        "subject": subject,
        "topic": topic,
        "questionText": question_hi,
        "questionTextEn": question_en,
        "options": [{"key": o["key"], "text": f"{o['hi']} ({o['en']})", "isCorrect": o["key"] == correct_option} for o in options],
        "correctOption": correct_option,
        "explanation": explanation,
        "instagramImageUrl": kit_data["relativePaths"]["reelImage"],
        "twitterImageUrl": kit_data["relativePaths"]["twitterImage"],
        "instagramCaption": instagram_caption,
        "pinnedComment": pinned_comment,
        "suggestedSongs": suggested_songs,
        "tweetText": tweet_text,
        "status": kit_data["status"],
        "createdAt": kit_data["createdAt"]
    }

    history_list = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                history_list = json.load(f)
        except Exception:
            history_list = []

    # Update or prepend
    existing_idx = next((i for i, item in enumerate(history_list) if item.get("id") == history_item["id"]), None)
    if existing_idx is not None:
        history_list[existing_idx] = history_item
    else:
        history_list.insert(0, history_item)

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history_list, f, ensure_ascii=False, indent=2)

    print(f"🎉 Successfully registered in Admin Social Studio History!")
    return kit_data

if __name__ == "__main__":
    # Test batch with CET Question 1
    opts_q1 = [
        {"key": "A", "hi": "प्रश्नवाचक", "en": "Prashnavachak"},
        {"key": "B", "hi": "संबंधवाचक", "en": "Sambandhvachak"},
        {"key": "C", "hi": "निजवाचक", "en": "Nijvachak"},
        {"key": "D", "hi": "अनिश्चयवाचक", "en": "Anishchayvachak"}
    ]
    generate_social_kit(
        exam_name="Rajasthan CET (Sr. Secondary)",
        year="2024",
        question_num=1,
        subject="सामान्य हिंदी",
        topic="संज्ञा व सर्वनाम",
        question_hi="‘उसने कुछ नहीं खाया’ इसमें ‘कुछ’ कौन-सा सर्वनाम है?",
        question_en="In 'उसने कुछ नहीं खाया', which pronoun is 'कुछ'?",
        options=opts_q1,
        correct_option="D",
        explanation="‘कुछ’ अनिश्चयवाचक सर्वनाम है क्योंकि इससे किसी निश्चित व्यक्ति या वस्तु का बोध नहीं होता।",
        exam_badge="CET Senior Secondary 2024 का महत्वपूर्ण सवाल",
        subject_badge="GENERAL HINDI | सामान्य हिंदी"
    )
