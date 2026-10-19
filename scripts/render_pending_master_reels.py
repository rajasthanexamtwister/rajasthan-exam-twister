import os
import sys
import io
import json
import subprocess

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def render_pending_reels():
    data_file = os.path.abspath("public/uploads/social_posts_history.json")
    with open(data_file, "r", encoding="utf-8") as f:
        history = json.load(f)

    logo_path = os.path.abspath("public/brand/logo.png").replace("\\", "/")

    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    ]
    edge_exe = next((p for p in edge_paths if os.path.exists(p)), None)
    if not edge_exe:
        print("Edge executable not found.")
        return

    traps = {
        12: "75% छात्र यहाँ 'निरस' या 'निर्‌रस' चुनते हैं, जबकि विसर्ग के बाद 'र' आने पर स्वर दीर्घ होकर 'नीरस' बनता है!",
        13: "केवल ऑक्सीजन या केवल जल से जंग नहीं लगता, जंग (Fe₂O₃·xH₂O) के लिए O₂ + नमी दोनों अनिवार्य हैं!",
        14: "2 अक्टूबर 1959 को पं. नेहरू द्वारा राजस्थान के नागौर (बगदरी गाँव) में इसका ऐतिहासिक शुभारंभ हुआ था!",
        15: "'RRR' को लोकप्रिय फिल्म मिला, जबकि 69वीं 'सर्वश्रेष्ठ फीचर फिल्म' का अवॉर्ड 'रॉकेट्री: द नंबी इफेक्ट' को मिला!"
    }

    shared_css = """
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            width: 1080px;
            height: 1920px;
            background: #050811;
            color: #FFFFFF;
            font-family: 'Mukta', sans-serif;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 60px 140px 180px 50px;
        }
        .ambient-radial-gold {
            position: absolute;
            top: 250px;
            left: 50%;
            transform: translateX(-50%);
            width: 900px;
            height: 900px;
            background: radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.05) 45%, transparent 70%);
            pointer-events: none;
            z-index: 1;
        }
        .ambient-radial-cyan {
            position: absolute;
            bottom: 300px;
            left: 20%;
            width: 700px;
            height: 700px;
            background: radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 65%);
            pointer-events: none;
            z-index: 1;
        }
        .fort-silhouette {
            position: absolute;
            bottom: 120px;
            left: 0;
            width: 100%;
            z-index: 1;
            pointer-events: none;
        }
        .jharokha-top {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 1;
            pointer-events: none;
        }
        .cyber-grid {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background-image: 
                radial-gradient(rgba(245, 158, 11, 0.12) 1.5px, transparent 1.5px),
                linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
            background-size: 40px 40px, 80px 80px, 80px 80px;
            z-index: 1;
            pointer-events: none;
        }
        .master-content {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            height: 100%;
            justify-content: space-between;
        }
        .top-brand-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(30, 41, 59, 0.75) 100%);
            backdrop-filter: blur(24px);
            border: 2px solid rgba(245, 158, 11, 0.45);
            border-radius: 28px;
            padding: 16px 26px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .logo-wrap {
            display: flex;
            align-items: center;
            gap: 18px;
        }
        .official-logo-img {
            width: 110px;
            height: 110px;
            object-fit: contain;
            border-radius: 50%;
            filter: drop-shadow(0 0 18px rgba(245, 158, 11, 0.65));
        }
        .brand-text-block {
            display: flex;
            flex-direction: column;
        }
        .brand-main-title {
            font-family: 'Outfit', sans-serif;
            font-size: 34px;
            font-weight: 900;
            letter-spacing: 1.5px;
            background: linear-gradient(135deg, #FFFFFF 0%, #FDE68A 40%, #F59E0B 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1.1;
        }
        .brand-slogan-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 4px;
        }
        .brand-slogan-text {
            font-size: 19px;
            font-weight: 700;
            color: #FBBF24;
            letter-spacing: 0.5px;
        }
        .header-tags-cluster {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
        }
        .quiz-pill-badge {
            background: linear-gradient(135deg, #BE123C 0%, #9F1239 100%);
            border: 1.5px solid #FDE68A;
            border-radius: 14px;
            padding: 6px 18px;
            font-family: 'Outfit', sans-serif;
            font-size: 17px;
            font-weight: 900;
            color: #FFFFFF;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(190, 18, 60, 0.5);
        }
        .category-sub-tag {
            font-size: 16px;
            font-weight: 800;
            color: #94A3B8;
            letter-spacing: 0.8px;
        }
        .timer-challenge-bar {
            margin-top: 18px;
            background: rgba(15, 23, 42, 0.8);
            border: 1.5px solid rgba(245, 158, 11, 0.4);
            border-radius: 18px;
            padding: 12px 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
        }
        .timer-lead {
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Outfit', sans-serif;
            font-size: 21px;
            font-weight: 900;
            color: #FEF3C7;
        }
        .timer-track {
            flex: 1;
            margin: 0 20px;
            height: 12px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            overflow: hidden;
            position: relative;
        }
        .timer-fill {
            width: 70%;
            height: 100%;
            background: linear-gradient(90deg, #F59E0B 0%, #EF4444 100%);
            border-radius: 10px;
            box-shadow: 0 0 16px rgba(245, 158, 11, 0.9);
        }
        .timer-hook-text {
            font-size: 20px;
            font-weight: 800;
            color: #FBBF24;
        }
        .question-panel-3d {
            margin-top: 20px;
            background: linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(24, 34, 53, 0.85) 100%);
            backdrop-filter: blur(28px);
            border: 2px solid rgba(245, 158, 11, 0.4);
            border-top: 5px solid #F59E0B;
            border-radius: 28px;
            padding: 34px 30px 28px 30px;
            position: relative;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(245, 158, 11, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.25);
        }
        .q-floating-badge {
            position: absolute;
            top: -20px;
            left: 30px;
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            color: #050811;
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 19px;
            padding: 5px 20px;
            border-radius: 12px;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
        }
        .q-meta-row {
            margin-top: 10px;
            margin-bottom: 12px;
        }
        .exam-target-chip {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 4px 14px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 700;
            color: #E2E8F0;
        }
        .q-body-hindi {
            font-size: 38px;
            font-weight: 800;
            line-height: 1.35;
            color: #FFFFFF;
            margin-bottom: 12px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
        }
        .highlight-keyword {
            color: #FDE047;
            text-decoration: underline;
            text-decoration-color: #F59E0B;
            text-decoration-thickness: 3px;
            text-underline-offset: 6px;
        }
        .q-body-english {
            font-size: 21px;
            font-weight: 600;
            color: #94A3B8;
            font-style: italic;
            line-height: 1.3;
        }
        .options-stack {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 22px;
        }
        .option-card-gaming {
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%);
            border: 2px solid rgba(255, 255, 255, 0.15);
            border-left: 6px solid #F59E0B;
            border-radius: 20px;
            padding: 16px 24px;
            display: flex;
            align-items: center;
            gap: 22px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }
        .option-key-badge {
            width: 58px;
            height: 58px;
            background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
            border: 2px solid #F59E0B;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Outfit', sans-serif;
            font-size: 28px;
            font-weight: 900;
            color: #FDE68A;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
            flex-shrink: 0;
        }
        .option-text-cluster {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .option-hindi-title {
            font-size: 30px;
            font-weight: 800;
            color: #FFFFFF;
            line-height: 1.2;
        }
        .option-english-sub {
            font-size: 18px;
            font-weight: 600;
            color: #94A3B8;
        }
        .brand-trap-box {
            margin-top: 18px;
            background: rgba(190, 18, 60, 0.12);
            border: 2px dashed rgba(245, 158, 11, 0.7);
            border-radius: 18px;
            padding: 14px 22px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        }
        .trap-label {
            background: #BE123C;
            color: #FFFFFF;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 900;
            padding: 6px 14px;
            border-radius: 10px;
            white-space: nowrap;
            letter-spacing: 1px;
            box-shadow: 0 3px 10px rgba(190, 18, 60, 0.6);
        }
        .trap-message {
            font-size: 20px;
            font-weight: 700;
            color: #FDE68A;
            line-height: 1.3;
        }
        .bottom-cta-stack {
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .comment-trigger-pill {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            border-radius: 20px;
            padding: 16px 26px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #050811;
            font-weight: 900;
            box-shadow: 0 10px 30px rgba(245, 158, 11, 0.4);
        }
        .comment-lead-text {
            font-size: 24px;
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .comment-action-badge {
            background: #050811;
            color: #FDE68A;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 900;
            padding: 8px 18px;
            border-radius: 12px;
            letter-spacing: 0.8px;
        }
        .social-action-strip {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 18px;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 800;
            color: #94A3B8;
            letter-spacing: 0.8px;
        }
        .brand-footer-signature {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 18px;
            font-weight: 800;
            color: #64748B;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            padding-top: 12px;
        }
        .footer-handle {
            font-family: 'Outfit', sans-serif;
            color: #F59E0B;
        }
    """

    svg_decorations = """
    <svg class="fort-silhouette" viewBox="0 0 1080 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 320V260C25 258 50 255 75 250V210H105V250C130 248 160 246 185 240V190H210V170H230V190H255V235C290 230 330 220 370 200V150H400V130H420V150H450V190C490 170 540 140 590 120V70H610V50H640V70H660V110C710 105 760 115 805 130V90H830V70H855V90H880V145C930 165 980 200 1025 230V195H1050V245C1060 250 1070 255 1080 260V320H0Z" fill="url(#fortGrad)" fill-opacity="0.35"/>
        <defs>
            <linearGradient id="fortGrad" x1="540" y1="50" x2="540" y2="320" gradientUnits="userSpaceOnUse">
                <stop stop-color="#F59E0B" stop-opacity="0.25"/>
                <stop offset="0.6" stop-color="#1E293B" stop-opacity="0.6"/>
                <stop offset="1" stop-color="#060A14" stop-opacity="0.95"/>
            </linearGradient>
        </defs>
    </svg>
    <svg class="jharokha-top" viewBox="0 0 1080 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0H1080V40C1000 40 960 90 900 90C840 90 800 40 720 40C640 40 600 90 540 90C480 90 440 40 360 40C280 40 240 90 180 90C120 90 80 40 0 40V0Z" fill="url(#jaaliGrad)" fill-opacity="0.3"/>
        <defs>
            <linearGradient id="jaaliGrad" x1="540" y1="0" x2="540" y2="90" gradientUnits="userSpaceOnUse">
                <stop stop-color="#F59E0B" stop-opacity="0.4"/>
                <stop offset="1" stop-color="#F59E0B" stop-opacity="0"/>
            </linearGradient>
        </defs>
    </svg>
    """

    for item in history:
        q_num = item.get("questionNumber")
        if q_num not in [12, 13, 14, 15]:
            continue

        q_id = item.get("id")
        q_hi = item.get("questionHi") or item.get("questionText", "")
        q_en = item.get("questionEn") or item.get("questionTextEn", "")
        subj = item.get("subject", "RAJASTHAN GK")
        options = item.get("options", [])
        trap_msg = traps.get(q_num, "बिना सोचे समझे उत्तर न दें, Pinned Comment में सही उत्तर व व्याख्या देखें!")

        # Format options
        opts_html = ""
        for opt in options:
            key = opt.get("key", "")
            text = opt.get("text", "")
            opts_html += f"""
            <div class="option-card-gaming">
                <div class="option-key-badge">{key}</div>
                <div class="option-text-cluster">
                    <div class="option-hindi-title">{text}</div>
                </div>
            </div>
            """

        html = f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920">
    <title>Q{q_num} Master Reel</title>
    <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@500;700;800;900&family=Outfit:wght@600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
    <style>
        {shared_css}
    </style>
</head>
<body>
    <div class="ambient-radial-gold"></div>
    <div class="ambient-radial-cyan"></div>
    <div class="cyber-grid"></div>
    {svg_decorations}

    <div class="master-content">
        <div class="top-brand-header">
            <div class="logo-wrap">
                <img src="file:///{logo_path}" class="official-logo-img" alt="Official Logo">
                <div class="brand-text-block">
                    <div class="brand-main-title">RAJASTHAN EXAM TWISTER</div>
                    <div class="brand-slogan-pill">
                        <span class="brand-slogan-text">सवाल सीधा नहीं, सोच टेढ़ी करो!</span>
                        <span>⚡</span>
                    </div>
                </div>
            </div>
            <div class="header-tags-cluster">
                <div class="quiz-pill-badge">DAILY QUIZ</div>
                <div class="category-sub-tag">{subj.split('|')[0].strip()}</div>
            </div>
        </div>

        <div class="timer-challenge-bar">
            <div class="timer-lead">
                <span>⏱️</span>
                <span>05s TIMER</span>
            </div>
            <div class="timer-track">
                <div class="timer-fill"></div>
            </div>
            <div class="timer-hook-text">
                <span>🧠 बिना Google किए उत्तर दो!</span>
            </div>
        </div>

        <div class="question-panel-3d">
            <div class="q-floating-badge">
                <span>🎯</span>
                <span>QUIZ CHALLENGE</span>
            </div>
            <div class="q-meta-row">
                <span class="exam-target-chip">CET 2024 / REET / Patwar Special</span>
            </div>
            <div class="q-body-hindi">
                {q_hi}
            </div>
            {f'<div class="q-body-english">{q_en}</div>' if q_en else ''}
        </div>

        <div class="options-stack">
            {opts_html}
        </div>

        <div class="brand-trap-box">
            <div class="trap-label">⚠️ EXAM TRAP</div>
            <div class="trap-message">{trap_msg}</div>
        </div>

        <div class="bottom-cta-stack">
            <div class="comment-trigger-pill">
                <div class="comment-lead-text">
                    <span>💬</span>
                    <span>अपना जवाब Comment करो (A, B, C या D)</span>
                </div>
                <div class="comment-action-badge">PINNED COMMENT 👇</div>
            </div>

            <div class="social-action-strip">
                <div class="action-chip">💾 SAVE FOR REVISION</div>
                <div>•</div>
                <div class="action-chip">🚀 SHARE WITH FRIENDS</div>
                <div>•</div>
                <div class="action-chip">🏆 CHALLENGE TOPPERS</div>
            </div>

            <div class="brand-footer-signature">
                <div>📌 सही उत्तर व व्याख्या Pinned Comment में देखें</div>
                <div class="footer-handle">@RajasthanExamTwister</div>
            </div>
        </div>
    </div>
</body>
</html>"""

        temp_html = f"temp_render_q{q_num}.html"
        with open(temp_html, "w", encoding="utf-8") as tf:
            tf.write(html)

        out_img = os.path.abspath(f"public/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-{q_num}/reel_9_16.jpg")
        os.makedirs(os.path.dirname(out_img), exist_ok=True)

        cmd = [
            edge_exe,
            "--headless",
            "--disable-gpu",
            "--force-device-scale-factor=1",
            "--window-size=1080,1920",
            f"--screenshot={out_img}",
            f"file:///{os.path.abspath(temp_html)}"
        ]
        subprocess.run(cmd, check=True)
        print(f"✅ Rendered Q{q_num} Master Reel (1080x1920): {out_img}")

        if os.path.exists(temp_html):
            os.remove(temp_html)

        # Update item instagramImageUrl to ensure fresh load
        item["instagramImageUrl"] = f"/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-{q_num}/reel_9_16.jpg?v=master_{q_num}"

    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print("\nAll pending reels (Q12, Q13, Q14, Q15) successfully rendered with Master Template!")

if __name__ == "__main__":
    render_pending_reels()
