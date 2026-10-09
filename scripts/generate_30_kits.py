import os
import sys
import json
import time
import base64
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
DATA_FILE = BASE_DIR / "scripts" / "remaining_questions_data.json"
LOGO_FILE = BASE_DIR / "public" / "brand" / "examtwister_logo.png"

def get_logo_data_uri():
    if LOGO_FILE.exists():
        with open(LOGO_FILE, "rb") as f:
            return f"data:image/png;base64,{base64.b64encode(f.read()).decode('utf-8')}"
    return ""

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

def build_html_template(
    exam_title,
    sub_title,
    question_hi,
    question_sub,
    options,
    topic_name="राजस्थान भर्ती परीक्षा",
    logo_src=""
):
    # Ensure 4 options
    opt_a = options[0]["text"] if len(options) > 0 else "विकल्प A"
    opt_b = options[1]["text"] if len(options) > 1 else "विकल्प B"
    opt_c = options[2]["text"] if len(options) > 2 else "विकल्प C"
    opt_d = options[3]["text"] if len(options) > 3 else "विकल्प D"

    return f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920, initial-scale=1.0">
    <title>Social Kit</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            width: 1080px;
            height: 1920px;
            overflow: hidden;
            font-family: 'Mukta', sans-serif;
            background: #0B192C;
            color: #ffffff;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }}
        .top-hero-section {{
            position: relative;
            width: 100%;
            height: 820px;
            background: linear-gradient(180deg, #183B5E 0%, #102A45 40%, #0B192C 100%);
            padding: 45px 45px 20px 45px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
        }}
        .heritage-backdrop {{
            position: absolute;
            inset: 0;
            background: 
                radial-gradient(circle at 65% 35%, rgba(245, 158, 11, 0.35) 0%, rgba(24, 59, 94, 0) 60%),
                linear-gradient(180deg, rgba(11, 25, 44, 0.4) 0%, rgba(11, 25, 44, 0.95) 100%);
            z-index: 1;
        }}
        .header-top-row {{
            position: relative;
            z-index: 10;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
        }}
        .brand-logo-wrap {{
            width: 200px;
            height: 200px;
            filter: drop-shadow(0 15px 30px rgba(0,0,0,0.8));
            flex-shrink: 0;
        }}
        .brand-logo-wrap img {{
            width: 100%;
            height: 100%;
            object-fit: contain;
        }}
        .header-center-info {{
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            margin-top: 10px;
        }}
        .main-subject-title {{
            font-family: 'Poppins', sans-serif;
            font-size: 50px;
            font-weight: 900;
            color: #FFFFFF;
            line-height: 1;
            letter-spacing: -1px;
            text-shadow: 0 4px 15px rgba(0,0,0,0.9);
        }}
        .main-subject-title span {{ color: #FBBF24; }}
        .exam-sub-ribbon {{
            background: #DC2626;
            color: #FFFFFF;
            font-family: 'Poppins', sans-serif;
            font-size: 24px;
            font-weight: 900;
            padding: 6px 18px;
            border-radius: 8px;
            letter-spacing: 1px;
            text-transform: uppercase;
            box-shadow: 0 6px 15px rgba(220, 38, 38, 0.5);
        }}
        .for-exams-pill {{
            background: #FBBF24;
            color: #0F172A;
            font-family: 'Poppins', sans-serif;
            font-size: 18px;
            font-weight: 800;
            padding: 4px 14px;
            border-radius: 6px;
        }}
        .target-chips {{
            background: #991B1B;
            color: #FFFBEB;
            font-family: 'Poppins', sans-serif;
            font-size: 16px;
            font-weight: 800;
            padding: 4px 14px;
            border-radius: 6px;
            letter-spacing: 1px;
        }}
        .header-right-quote {{
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            text-align: right;
            gap: 8px;
            margin-top: 5px;
        }}
        .quote-learn-bar {{
            font-family: 'Poppins', sans-serif;
            font-size: 15px;
            font-weight: 800;
            color: #FDE68A;
            line-height: 1.25;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }}
        .quote-card-box {{
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 10px 14px;
            max-width: 220px;
        }}
        .quote-card-box p {{
            font-family: 'Poppins', sans-serif;
            font-size: 16px;
            font-weight: 800;
            color: #FFFFFF;
            line-height: 1.2;
        }}
        .tricolor-strip {{
            display: flex;
            height: 4px;
            width: 100%;
            border-radius: 2px;
            overflow: hidden;
            margin-top: 6px;
        }}
        .tricolor-strip .saffron {{ background: #FF9933; flex: 1; }}
        .tricolor-strip .white {{ background: #FFFFFF; flex: 1; }}
        .tricolor-strip .green {{ background: #138808; flex: 1; }}

        .hero-elements-row {{
            position: relative;
            z-index: 10;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 20px;
            margin-top: 20px;
        }}
        .hero-portrait-card {{
            width: 280px;
            background: rgba(15, 23, 42, 0.85);
            border: 2px solid #F59E0B;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 15px 30px rgba(0,0,0,0.7);
        }}
        .portrait-img-box {{
            width: 100%;
            height: 200px;
            background: radial-gradient(circle, #334155 0%, #0F172A 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .portrait-img-box img {{
            width: 150px;
            height: 150px;
            object-fit: contain;
        }}
        .portrait-plaque {{
            background: #F1F5F9;
            color: #0F172A;
            padding: 8px 12px;
            text-align: center;
            border-top: 2px solid #F59E0B;
        }}
        .portrait-plaque h4 {{
            font-family: 'Poppins', sans-serif;
            font-size: 16px;
            font-weight: 800;
            color: #0F172A;
        }}
        .portrait-plaque p {{
            font-size: 13px;
            font-weight: 700;
            color: #475569;
        }}
        .hero-vintage-plaque {{
            flex: 1;
            background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%);
            border: 4px solid #B45309;
            border-radius: 18px;
            padding: 20px 24px;
            text-align: center;
            color: #0F172A;
            box-shadow: 0 15px 35px rgba(0,0,0,0.6), inset 0 0 20px rgba(217, 119, 6, 0.25);
            max-width: 380px;
        }}
        .plaque-title {{
            font-family: 'Poppins', sans-serif;
            font-size: 26px;
            font-weight: 900;
            color: #78350F;
            letter-spacing: 1px;
            line-height: 1.1;
        }}
        .plaque-year {{
            font-size: 38px;
            font-weight: 900;
            color: #9A3412;
            margin: 4px 0;
            line-height: 1;
        }}
        .plaque-tagline {{
            font-family: 'Poppins', sans-serif;
            font-size: 15px;
            font-weight: 800;
            color: #92400E;
            letter-spacing: 1px;
            text-transform: uppercase;
        }}
        .hero-books-stack {{
            width: 290px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }}
        .book-spine {{
            background: linear-gradient(90deg, #1E293B 0%, #334155 50%, #0F172A 100%);
            border: 1.5px solid #F59E0B;
            border-radius: 8px;
            padding: 10px 16px;
            font-family: 'Poppins', sans-serif;
            font-size: 14px;
            font-weight: 800;
            color: #FDE68A;
            letter-spacing: 1px;
            text-transform: uppercase;
            box-shadow: 0 6px 14px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
        }}

        .bottom-quiz-section {{
            position: relative;
            z-index: 20;
            padding: 0 45px 35px 45px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }}
        .question-card-frame {{
            background: #FFFFFF;
            border-radius: 28px;
            padding: 45px 35px 28px 35px;
            position: relative;
            box-shadow: 0 20px 45px rgba(0,0,0,0.6);
            border: 4px solid #F59E0B;
            text-align: center;
        }}
        .q-circle-badge {{
            position: absolute;
            top: -46px;
            left: 50%;
            transform: translateX(-50%);
            width: 92px;
            height: 92px;
            background: #FBBF24;
            border: 6px solid #FFFFFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Poppins', sans-serif;
            font-size: 48px;
            font-weight: 900;
            color: #0F172A;
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.6);
        }}
        .q-main-title {{
            font-size: 40px;
            font-weight: 900;
            line-height: 1.35;
            color: #0F172A;
            margin-bottom: 6px;
        }}
        .q-sub-title {{
            font-size: 24px;
            font-weight: 700;
            color: #475569;
        }}
        .options-2x2-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
        }}
        .option-pill-card {{
            background: #FFFFFF;
            border-radius: 22px;
            padding: 20px 22px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 12px 28px rgba(0,0,0,0.35);
            border: 2.5px solid #E2E8F0;
        }}
        .opt-circle-num {{
            width: 58px;
            height: 58px;
            background: #DC2626;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Poppins', sans-serif;
            font-size: 30px;
            font-weight: 900;
            color: #FFFFFF;
            flex-shrink: 0;
            box-shadow: 0 6px 14px rgba(220, 38, 38, 0.45);
        }}
        .opt-content-text {{
            font-size: 30px;
            font-weight: 800;
            line-height: 1.15;
            color: #0F172A;
            text-align: left;
        }}
        .cta-challenge-bar {{
            background: linear-gradient(90deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
            border: 2.5px solid #F43F5E;
            border-radius: 50px;
            padding: 16px 25px;
            text-align: center;
            font-size: 30px;
            font-weight: 900;
            color: #FFFFFF;
            box-shadow: 0 10px 25px rgba(244, 63, 94, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }}
        .study-features-ribbon {{
            background: rgba(15, 23, 42, 0.95);
            border: 1.5px solid #334155;
            border-radius: 18px;
            padding: 16px 20px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            font-size: 20px;
            font-weight: 800;
            color: #F1F5F9;
            box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        }}
        .bottom-slogan-wrap {{
            background: linear-gradient(90deg, #F59E0B 0%, #FDE68A 50%, #F59E0B 100%);
            border: 3px solid #B45309;
            border-radius: 20px;
            padding: 18px 20px;
            text-align: center;
            color: #0F172A;
            box-shadow: 0 15px 35px rgba(245, 158, 11, 0.5);
        }}
        .slogan-heading {{
            font-size: 38px;
            font-weight: 900;
            line-height: 1.15;
        }}
        .slogan-channel {{
            font-family: 'Poppins', sans-serif;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 2px;
            color: #1E293B;
        }}
        .hashtags-row {{
            text-align: center;
            font-family: 'Poppins', sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: #94A3B8;
            letter-spacing: 1px;
            margin-top: -6px;
        }}
    </style>
</head>
<body>
    <div class="top-hero-section">
        <div class="heritage-backdrop"></div>
        <div class="header-top-row">
            <div class="brand-logo-wrap">
                <img src="{logo_src or 'http://localhost:3000/brand/examtwister_logo.png'}" alt="Logo">
            </div>
            <div class="header-center-info">
                <div class="main-subject-title">{exam_title}</div>
                <div class="exam-sub-ribbon">{sub_title}</div>
                <div class="for-exams-pill">FOR COMPETITIVE EXAMS</div>
                <div class="target-chips">RPSC | RAS | CET | REET | LDC</div>
            </div>
            <div class="header-right-quote">
                <div class="quote-learn-bar">LEARN<br>PRACTICE<br>IMPROVE<br>SUCCEED</div>
                <div class="quote-card-box">
                    <p>“EDUCATION BUILDS A STRONGER NATION”</p>
                    <div class="tricolor-strip">
                        <div class="saffron"></div>
                        <div class="white"></div>
                        <div class="green"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="hero-elements-row">
            <div class="hero-portrait-card">
                <div class="portrait-img-box">
                    <img src="{logo_src or 'http://localhost:3000/brand/examtwister_logo.png'}" alt="Mascot">
                </div>
                <div class="portrait-plaque">
                    <h4>RAJASTHAN EXAM TWISTER</h4>
                    <p>राजस्थान भर्ती परीक्षा स्पेशल</p>
                </div>
            </div>

            <div class="hero-vintage-plaque">
                <div class="plaque-title">CET 2024 SPECIAL</div>
                <div class="plaque-year">2024</div>
                <div class="plaque-tagline">{topic_name}</div>
            </div>

            <div class="hero-books-stack">
                <div class="book-spine">📖 RAJASTHAN GK</div>
                <div class="book-spine">📚 CET SYLLABUS 2024</div>
                <div class="book-spine">🎯 PREVIOUS YEAR QS</div>
                <div class="book-spine">🏆 SELECTION SERIES</div>
            </div>
        </div>
    </div>

    <div class="bottom-quiz-section">
        <div class="question-card-frame">
            <div class="q-circle-badge">Q.</div>
            <div class="q-main-title">{question_hi}</div>
            <div class="q-sub-title">{question_sub}</div>
        </div>

        <div class="options-2x2-grid">
            <div class="option-pill-card">
                <div class="opt-circle-num">A</div>
                <div class="opt-content-text">{opt_a}</div>
            </div>
            <div class="option-pill-card">
                <div class="opt-circle-num">B</div>
                <div class="opt-content-text">{opt_b}</div>
            </div>
            <div class="option-pill-card">
                <div class="opt-circle-num">C</div>
                <div class="opt-content-text">{opt_c}</div>
            </div>
            <div class="option-pill-card">
                <div class="opt-circle-num">D</div>
                <div class="opt-content-text">{opt_d}</div>
            </div>
        </div>

        <div class="cta-challenge-bar">
            🧠 बिना Google किए अपना Option बताओ! 🎯
        </div>

        <div class="study-features-ribbon">
            <span>📖 STUDY SMARTER</span>
            <span>💡 PRACTICE REGULARLY</span>
            <span>📈 IMPROVE EVERYDAY</span>
            <span>🏆 CRACK EXAMS</span>
        </div>

        <div class="bottom-slogan-wrap">
            <div class="slogan-heading">सवाल सीधा नहीं, सोच टेढ़ी करो!</div>
            <div class="slogan-channel">RAJASTHAN EXAM TWISTER</div>
        </div>

        <div class="hashtags-row">
            #RajasthanGK  #RajasthanCET  #CET2024  #RPSC  #RAS  #REET  #ExamTwister
        </div>
    </div>
</body>
</html>"""

def main():
    browser = get_browser_path()
    logo_data_uri = get_logo_data_uri()
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        questions = json.load(f)

    target_count = min(30, len(questions))
    print(f"Generating {target_count} social media kits...")

    history_entries = []

    for idx in range(target_count):
        q = questions[idx]
        q_num = idx + 1
        q_text = q.get("questionText", f"Question {q_num}")
        options_raw = q.get("options", [])
        correct_letter = q.get("correctOptionLetter", "A")
        explanation = q.get("explanation", "विस्तृत व्याख्या जल्द उपलब्ध कराई जाएगी।")
        quiz_group = q.get("quizGroup", "Rajasthan GK")
        
        # Prepare 4 options formatted
        opt_list = []
        letters = ["A", "B", "C", "D"]
        for opt_idx, opt_text in enumerate(options_raw[:4]):
            letter = letters[opt_idx]
            is_corr = (letter == correct_letter)
            opt_list.append({
                "key": letter,
                "text": opt_text,
                "hi": opt_text,
                "en": "",
                "isCorrect": is_corr
            })

        exam_slug = "rajasthan-cet-sr-secondary"
        year_str = "2024"
        kit_dir = SOCIAL_KITS_DIR / exam_slug / year_str / f"question-{q_num}"
        kit_dir.mkdir(parents=True, exist_ok=True)

        reel_img_path = kit_dir / "reel_9_16.jpg"
        twitter_img_path = kit_dir / "twitter_card.jpg"
        kit_json_path = kit_dir / "kit.json"

        # Generate HTML
        html_code = build_html_template(
            exam_title="RAJASTHAN <span>GK</span>",
            sub_title=f"CET 2024 QUESTION #{q_num}",
            question_hi=q_text,
            question_sub="(निम्न में से सबसे उपयुक्त विकल्प चुनें)",
            options=opt_list,
            topic_name=quiz_group,
            logo_src=logo_data_uri
        )

        tmp_html = BASE_DIR / f"temp_batch_{q_num}.html"
        with open(tmp_html, "w", encoding="utf-8") as f:
            f.write(html_code)

        # Screenshot via Edge
        cmd = [
            browser,
            "--headless",
            "--disable-gpu",
            "--force-device-scale-factor=1",
            "--window-size=1080,1920",
            f"--screenshot={str(reel_img_path)}",
            f"file:///{str(tmp_html)}"
        ]
        subprocess.run(cmd, check=True)

        # Generate Twitter Card
        im = Image.open(reel_img_path)
        w, h = im.size
        crop_top = int(h * 0.22)
        crop_bottom = int(h * 0.82)
        cropped = im.crop((0, crop_top, w, crop_bottom))
        cropped.save(twitter_img_path, quality=95)

        if tmp_html.exists():
            tmp_html.unlink()

        # Build Kit JSON
        opt_a = opt_list[0]["text"] if len(opt_list) > 0 else "A"
        opt_b = opt_list[1]["text"] if len(opt_list) > 1 else "B"
        opt_c = opt_list[2]["text"] if len(opt_list) > 2 else "C"
        opt_d = opt_list[3]["text"] if len(opt_list) > 3 else "D"

        caption = (
            f"🔥 राजस्थान CET 2024 महत्वपूर्ण सवाल #{q_num}! 🎯\n\n"
            f"📖 विषय: {quiz_group}\n"
            f"❓ प्रश्न: {q_text}\n"
            f"(निम्न में से सबसे उपयुक्त विकल्प चुनें)\n\n"
            f"विकल्प:\n"
            f"(A) {opt_a}\n"
            f"(B) {opt_b}\n"
            f"(C) {opt_c}\n"
            f"(D) {opt_d}\n\n"
            f"👇 बिना Google किए अपना Option तुरंत कमेंट में A, B, C या D बताएं!\n"
            f"📌 सही उत्तर व विस्तृत व्याख्या पहले Pinned Comment में देखें!\n\n"
            f"---\n"
            f"🔔 रोज़ाना ऐसे ही उच्च-स्तरीय प्रश्नों और मास्टर नोट्स के लिए फॉलो करें: @rajasthanexamtwister\n"
            f"🌐 फ्री टेस्ट व पीडीएफ नोट्स: rajasthanexamtwister.in\n\n"
            f"#RajasthanGK #RajasthanCET #CET2024 #REET #LDC #Patwar #RSSB #RPSC #ExamTwister #StudyWithTwister"
        )

        pinned = (
            f"✅ सही उत्तर: विकल्प ({correct_letter}) ✅\n\n"
            f"📌 विस्तृत व्याख्या (Explanation):\n{explanation}\n\n"
            f"💡 ऐसे ही विषयवार उच्च स्तरीय क्विज़ और नोट्स के लिए हमारे प्रोफाइल बायो में दिए गए लिंक से फ्री में अभ्यास करें! 🏆"
        )

        tweet = (
            f"🎯 Rajasthan CET 2024 Special | #{q_num}\n\n"
            f"Q. {q_text}\n\n"
            f"(A) {opt_a}\n(B) {opt_b}\n(C) {opt_c}\n(D) {opt_d}\n\n"
            f"सही उत्तर कमेंट में बताएं! 👇\n"
            f"व्याख्या व फ्री टेस्ट: https://rajasthanexamtwister.in\n\n"
            f"#RajasthanCET #CET2024 #RajasthanGK #RSSB"
        )

        kit_data = {
            "id": f"rajasthan-cet-sr-secondary-2024-q{q_num}",
            "date": "09 Oct 2026",
            "exam": "Rajasthan CET (Sr. Secondary)",
            "year": "2024",
            "examName": "Rajasthan CET (Sr. Secondary) 2024",
            "questionNumber": q_num,
            "subject": quiz_group,
            "topic": quiz_group,
            "questionHi": q_text,
            "questionEn": "",
            "questionText": q_text,
            "questionTextEn": "(निम्न में से सबसे उपयुक्त विकल्प चुनें)",
            "options": opt_list,
            "correctOption": correct_letter,
            "explanation": explanation,
            "relativePaths": {
                "reelImage": f"/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-{q_num}/reel_9_16.jpg",
                "twitterImage": f"/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-{q_num}/twitter_card.jpg",
                "kitJson": f"/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-{q_num}/kit.json"
            },
            "instagramImageUrl": f"/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-{q_num}/reel_9_16.jpg",
            "twitterImageUrl": f"/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-{q_num}/twitter_card.jpg",
            "instagramCaption": caption,
            "pinnedComment": pinned,
            "suggestedSongs": [
                {"title": "Aarambh Hai Prachand", "mood": "High Energy Motivation", "tag": "trending-exam"},
                {"title": "Kesariya Balam (Folk Beats)", "mood": "Rajasthani Cultural Pride", "tag": "viral-rajasthan"},
                {"title": "Kar Har Maidan Fateh", "mood": "Aspirant Inspiration", "tag": "study-grind"},
                {"title": "Lakshya Toh Har Haal Mein Paana Hai", "mood": "Laser Focus", "tag": "exam-focus"}
            ],
            "tweetText": tweet,
            "status": {
                "instagramUploaded": False,
                "instagramUploadedAt": None,
                "twitterPosted": False,
                "twitterPostedAt": None
            },
            "createdAt": "2026-10-09T01:30:00Z"
        }

        with open(kit_json_path, "w", encoding="utf-8") as f:
            json.dump(kit_data, f, ensure_ascii=False, indent=2)

        history_entries.append(kit_data)
        print(f"[{q_num}/{target_count}] Generated kit for Question #{q_num}")

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history_entries, f, ensure_ascii=False, indent=2)

    print(f"✅ Successfully generated and registered {len(history_entries)} social media kits in history!")

if __name__ == "__main__":
    main()
