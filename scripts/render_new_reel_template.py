import os
import subprocess

def render_reel():
    artifact_dir = r"C:\Users\Chirag Bhoi\.gemini\antigravity-ide\brain\7f8ee892-d8de-4a28-8592-5f01f67bcd8c"
    output_image = os.path.join(artifact_dir, "real_rendered_template_with_logo.jpg")
    output_reveal = os.path.join(artifact_dir, "real_rendered_reveal_with_logo.jpg")
    
    logo_path = os.path.abspath(r"public/brand/logo.png").replace("\\", "/")

    html_template = f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920">
    <title>Rajasthan Exam Twister Reel</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@500;700;800;900&family=Outfit:wght@600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            width: 1080px;
            height: 1920px;
            background: #060913;
            color: #FFFFFF;
            font-family: 'Mukta', sans-serif;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 60px 50px 50px 50px;
        }}

        /* BACKGROUND GLOWS */
        .bg-glow-top {{
            position: absolute;
            top: -150px;
            left: 50%;
            transform: translateX(-50%);
            width: 800px;
            height: 800px;
            background: radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.08) 50%, rgba(6, 9, 19, 0) 75%);
            z-index: 0;
            pointer-events: none;
        }}
        .bg-glow-bottom {{
            position: absolute;
            bottom: -150px;
            left: 50%;
            transform: translateX(-50%);
            width: 750px;
            height: 600px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(6, 9, 19, 0) 75%);
            z-index: 0;
            pointer-events: none;
        }}
        .grid-pattern {{
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
            background-size: 60px 60px;
            z-index: 0;
            pointer-events: none;
        }}

        .content-layer {{
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            height: 100%;
            justify-content: space-between;
        }}

        /* 1. TOP HEADER WITH OFFICIAL LOGO */
        .header-wrap {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(16px);
            border: 1.5px solid rgba(245, 158, 11, 0.35);
            border-radius: 28px;
            padding: 18px 28px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }}
        .logo-box {{
            display: flex;
            align-items: center;
            gap: 20px;
        }}
        .logo-img {{
            width: 120px;
            height: 120px;
            object-fit: contain;
            filter: drop-shadow(0 0 16px rgba(245, 158, 11, 0.5));
            animation: pulse-glow 3s infinite alternate;
        }}
        .brand-meta {{
            display: flex;
            flex-direction: column;
        }}
        .brand-title {{
            font-family: 'Outfit', sans-serif;
            font-size: 38px;
            font-weight: 900;
            letter-spacing: 1px;
            background: linear-gradient(135deg, #FFFBEB 0%, #FBBF24 50%, #F59E0B 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1.1;
        }}
        .brand-slogan {{
            font-size: 20px;
            font-weight: 700;
            color: #FCD34D;
            letter-spacing: 0.5px;
        }}
        .exam-badge {{
            background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);
            border: 1.5px solid #FCD34D;
            border-radius: 18px;
            padding: 10px 22px;
            text-align: right;
            box-shadow: 0 8px 20px rgba(220, 38, 38, 0.35);
        }}
        .exam-badge .exam-name {{
            font-family: 'Poppins', sans-serif;
            font-size: 20px;
            font-weight: 900;
            color: #FFFFFF;
            letter-spacing: 1px;
        }}
        .exam-badge .sub-exam {{
            font-size: 16px;
            font-weight: 700;
            color: #FEF08A;
        }}

        /* 2. 5-SECOND COUNTDOWN HOOK BAR */
        .timer-strip {{
            margin-top: 25px;
            background: rgba(15, 23, 42, 0.85);
            border: 1.5px solid rgba(245, 158, 11, 0.4);
            border-radius: 20px;
            padding: 14px 26px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        }}
        .timer-info {{
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            font-weight: 800;
            color: #FEF3C7;
        }}
        .timer-progress-track {{
            flex: 1;
            margin: 0 25px;
            height: 14px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            overflow: hidden;
            position: relative;
        }}
        .timer-progress-fill {{
            width: 70%;
            height: 100%;
            background: linear-gradient(90deg, #F59E0B, #EF4444);
            border-radius: 10px;
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.8);
        }}
        .timer-challenge {{
            font-size: 22px;
            font-weight: 800;
            color: #F59E0B;
        }}

        /* 3. QUESTION CARD */
        .question-card {{
            margin-top: 25px;
            background: rgba(17, 24, 39, 0.75);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.12);
            border-top: 4px solid #F59E0B;
            border-radius: 30px;
            padding: 38px 36px;
            position: relative;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
        }}
        .q-badge-float {{
            position: absolute;
            top: -24px;
            left: 36px;
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            color: #0F172A;
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 900;
            padding: 8px 24px;
            border-radius: 14px;
            border: 2px solid #FFFBEB;
            box-shadow: 0 8px 20px rgba(245, 158, 11, 0.5);
            letter-spacing: 1px;
        }}
        .q-topic-tag {{
            text-align: right;
            font-size: 19px;
            font-weight: 700;
            color: #94A3B8;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }}
        .q-text-hi {{
            font-size: 40px;
            font-weight: 800;
            line-height: 1.35;
            color: #F8FAFC;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }}
        .q-text-en {{
            font-size: 23px;
            font-weight: 600;
            color: #94A3B8;
            margin-top: 14px;
            line-height: 1.3;
        }}

        /* 4. VERTICAL STACKED OPTIONS */
        .options-container {{
            margin-top: 25px;
            display: flex;
            flex-direction: column;
            gap: 18px;
        }}
        .option-row {{
            background: rgba(17, 24, 39, 0.65);
            backdrop-filter: blur(16px);
            border: 1.5px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 18px 24px;
            display: flex;
            align-items: center;
            gap: 22px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
            transition: all 0.3s ease;
        }}
        .option-row.correct-revealed {{
            background: linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 78, 59, 0.45) 100%);
            border: 2.5px solid #10B981;
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
        }}
        .opt-key {{
            width: 64px;
            height: 64px;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.08);
            border: 2px solid rgba(245, 158, 11, 0.5);
            color: #F59E0B;
            font-family: 'Outfit', sans-serif;
            font-size: 28px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            flex-shrink: 0;
        }}
        .option-row.correct-revealed .opt-key {{
            background: #10B981;
            border-color: #34D399;
            color: #FFFFFF;
        }}
        .opt-body {{
            display: flex;
            flex-direction: column;
            flex: 1;
        }}
        .opt-text {{
            font-size: 32px;
            font-weight: 800;
            color: #F8FAFC;
        }}
        .opt-sub {{
            font-size: 20px;
            font-weight: 600;
            color: #94A3B8;
        }}
        .check-badge {{
            font-size: 32px;
            color: #10B981;
            margin-right: 10px;
        }}

        /* 5. EXAM TWISTER TRAP BOX */
        .twister-trap-box {{
            margin-top: 22px;
            background: linear-gradient(135deg, rgba(185, 28, 28, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%);
            border: 1.5px dashed #F59E0B;
            border-radius: 22px;
            padding: 16px 24px;
            display: flex;
            align-items: center;
            gap: 16px;
        }}
        .trap-badge {{
            background: #F59E0B;
            color: #0F172A;
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 900;
            padding: 6px 14px;
            border-radius: 10px;
            letter-spacing: 0.5px;
            flex-shrink: 0;
        }}
        .trap-text {{
            font-size: 22px;
            font-weight: 700;
            color: #FEF3C7;
            line-height: 1.3;
        }}

        /* 6. BOTTOM CTA & WATERMARK */
        .bottom-section {{
            margin-top: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }}
        .cta-pill {{
            background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
            border: 2px solid #F59E0B;
            border-radius: 24px;
            padding: 18px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.6);
        }}
        .cta-text {{
            font-size: 25px;
            font-weight: 800;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        .cta-action {{
            font-family: 'Outfit', sans-serif;
            background: #F59E0B;
            color: #0F172A;
            font-size: 18px;
            font-weight: 900;
            padding: 8px 18px;
            border-radius: 12px;
            letter-spacing: 0.5px;
        }}
        .watermark-bar {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            color: #94A3B8;
            font-size: 19px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }}
        .watermark-handle {{
            color: #FCD34D;
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
        }}

        /* EXPLANATION CARD (For Slide 2) */
        .explanation-card {{
            margin-top: 15px;
            background: rgba(16, 185, 129, 0.12);
            border: 1.5px solid #10B981;
            border-radius: 20px;
            padding: 20px 24px;
        }}
        .exp-title {{
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 900;
            color: #34D399;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .exp-body {{
            font-size: 24px;
            font-weight: 700;
            color: #FFFFFF;
            line-height: 1.35;
        }}
    </style>
</head>
<body>
    <div class="bg-glow-top"></div>
    <div class="bg-glow-bottom"></div>
    <div class="grid-pattern"></div>

    <div class="content-layer">
        <!-- 1. TOP HEADER WITH OFFICIAL LOGO -->
        <div class="header-wrap">
            <div class="logo-box">
                <img src="file:///{logo_path}" class="logo-img" alt="Rajasthan Exam Twister Official Logo">
                <div class="brand-meta">
                    <div class="brand-title">RAJASTHAN EXAM TWISTER</div>
                    <div class="brand-slogan">सवाल सीधा नहीं, सोच टेढ़ी करो! 🎯</div>
                </div>
            </div>
            <div class="exam-badge">
                <div class="exam-name">CET 2024 (P421)</div>
                <div class="sub-exam">RPSC / RSSB SPECIAL</div>
            </div>
        </div>

        <!-- 2. 5-SECOND COUNTDOWN HOOK BAR -->
        <div class="timer-strip">
            <div class="timer-info">
                <span>⏳</span>
                <span>05s TIMER</span>
            </div>
            <div class="timer-progress-track">
                <div class="timer-progress-fill"></div>
            </div>
            <div class="timer-challenge">
                <span>🔥 सोचें और कमेंट करें!</span>
            </div>
        </div>

        <!-- 3. QUESTION CARD -->
        <div class="question-card">
            <div class="q-badge-float">QUESTION #01</div>
            <div class="q-topic-tag">📖 राजस्थान भूगोल व जनगणना (2011)</div>
            <div class="q-text-hi">2011 की जनगणना के अनुसार राजस्थान के किस जिले में लिंगानुपात सबसे अधिक है?</div>
            <div class="q-text-en">(Which district has the highest sex ratio in Rajasthan according to Census 2011?)</div>
        </div>

        <!-- 4. VERTICAL STACKED OPTIONS -->
        <div class="options-container">
            <div class="option-row">
                <div class="opt-key">A</div>
                <div class="opt-body">
                    <div class="opt-text">जयपुर जिला</div>
                    <div class="opt-sub">Jaipur District</div>
                </div>
            </div>
            <div class="option-row">
                <div class="opt-key">B</div>
                <div class="opt-body">
                    <div class="opt-text">अलवर जिला</div>
                    <div class="opt-sub">Alwar District</div>
                </div>
            </div>
            <div class="option-row">
                <div class="opt-key">C</div>
                <div class="opt-body">
                    <div class="opt-text">डूंगरपुर जिला</div>
                    <div class="opt-sub">Dungarpur District</div>
                </div>
            </div>
            <div class="option-row">
                <div class="opt-key">D</div>
                <div class="opt-body">
                    <div class="opt-text">बीकानेर जिला</div>
                    <div class="opt-sub">Bikaner District</div>
                </div>
            </div>
        </div>

        <!-- 5. EXAM TWISTER TRAP BOX -->
        <div class="twister-trap-box">
            <div class="trap-badge">⚠️ EXAM TRAP</div>
            <div class="trap-text">80% अभ्यर्थी यहाँ <b>डूंगरपुर (994)</b> और <b>राजसमंद (990)</b> में भ्रमित होकर 1/3 नेगेटिव मार्किंग करा बैठते हैं!</div>
        </div>

        <!-- 6. BOTTOM CTA & WATERMARK -->
        <div class="bottom-section">
            <div class="cta-pill">
                <div class="cta-text">
                    <span>💬</span>
                    <span>बिना Google किए कमेंट में A, B, C या D बताओ!</span>
                </div>
                <div class="cta-action">PINNED COMMENT 👇</div>
            </div>
            <div class="watermark-bar">
                <div>📌 सही उत्तर व विस्तृत व्याख्या Pinned Comment में!</div>
                <div class="watermark-handle">@RajasthanExamTwister</div>
            </div>
        </div>
    </div>
</body>
</html>"""

    html_file = "temp_reel_with_logo.html"
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_template)

    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    ]
    edge_exe = next((p for p in edge_paths if os.path.exists(p)), None)
    if not edge_exe:
        print("Edge browser not found")
        return

    abs_html = os.path.abspath(html_file)
    cmd = [
        edge_exe,
        "--headless",
        "--disable-gpu",
        "--force-device-scale-factor=1",
        "--window-size=1080,1920",
        f"--screenshot={output_image}",
        f"file:///{abs_html}"
    ]
    subprocess.run(cmd, check=True)
    print("Rendered Slide 1 with official logo:", output_image)

    # Now render Slide 2 (Answer Reveal)
    html_reveal = html_template.replace(
        """            <div class="option-row">
                <div class="opt-key">C</div>
                <div class="opt-body">
                    <div class="opt-text">डूंगरपुर जिला</div>
                    <div class="opt-sub">Dungarpur District</div>
                </div>
            </div>""",
        """            <div class="option-row correct-revealed">
                <div class="opt-key">C</div>
                <div class="opt-body">
                    <div class="opt-text">डूंगरपुर जिला (सर्वाधिक 994)</div>
                    <div class="opt-sub">Dungarpur District (Highest 994)</div>
                </div>
                <div class="check-badge">✅</div>
            </div>"""
    ).replace(
        """        <!-- 5. EXAM TWISTER TRAP BOX -->
        <div class="twister-trap-box">
            <div class="trap-badge">⚠️ EXAM TRAP</div>
            <div class="trap-text">80% अभ्यर्थी यहाँ <b>डूंगरपुर (994)</b> और <b>राजसमंद (990)</b> में भ्रमित होकर 1/3 नेगेटिव मार्किंग करा बैठते हैं!</div>
        </div>""",
        """        <!-- 5. EXPLANATION CARD -->
        <div class="explanation-card">
            <div class="exp-title">✅ सही उत्तर: विकल्प (C) डूंगरपुर</div>
            <div class="exp-body">2011 की जनगणना के अनुसार डूंगरपुर का लिंगानुपात <b>994</b> है जो पूरे राजस्थान में सर्वाधिक है। दूसरे स्थान पर <b>राजसमंद (990)</b> और तीसरे पर <b>पाली (987)</b> है।</div>
        </div>"""
    ).replace(
        "<span>⏳ 05s TIMER</span>",
        "<span>✅ TIME'S UP!</span>"
    ).replace(
        """<div class="timer-progress-fill"></div>""",
        """<div class="timer-progress-fill" style="width: 100%; background: #10B981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.8);"></div>"""
    )

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_reveal)

    cmd_reveal = [
        edge_exe,
        "--headless",
        "--disable-gpu",
        "--force-device-scale-factor=1",
        "--window-size=1080,1920",
        f"--screenshot={output_reveal}",
        f"file:///{abs_html}"
    ]
    subprocess.run(cmd_reveal, check=True)
    print("Rendered Slide 2 with official logo:", output_reveal)

    if os.path.exists(html_file):
        os.remove(html_file)

if __name__ == "__main__":
    render_reel()
