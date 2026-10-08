import os
import subprocess
import time
from pathlib import Path
from PIL import Image

def render_reference_style_graphic(
    exam_title="GENERAL HINDI",
    sub_title="CET 2024 MASTER PAPER 1",
    exam_badge="FOR COMPETITIVE EXAMS",
    target_exams="RPSC | RAS | CET | REET | LDC",
    quote_text="“KNOWLEDGE IS POWER, STUDY WITH TWISTER”",
    topic_plaque_title="HINDI GRAMMAR",
    topic_plaque_sub="सर्वनाम एवं उसके भेद",
    topic_plaque_note="A KEY TOPIC IN RAJASTHAN CET",
    question_hi="‘उसने कुछ नहीं खाया’ इसमें ‘कुछ’ कौन-सा सर्वनाम है?",
    question_sub="(निम्न में से सबसे उपयुक्त विकल्प चुनें)",
    options=None,
    output_path="public/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-1/reel_9_16.jpg",
    output_twitter="public/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-1/twitter_card.jpg"
):
    if options is None:
        options = [
            {"badge": "A", "text": "प्रश्नवाचक सर्वनाम"},
            {"badge": "B", "text": "संबंधवाचक सर्वनाम"},
            {"badge": "C", "text": "निजवाचक सर्वनाम"},
            {"badge": "D", "text": "अनिश्चयवाचक सर्वनाम"}
        ]

    # Ensure output dir exists
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    Path(output_twitter).parent.mkdir(parents=True, exist_ok=True)

    html_content = f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920, initial-scale=1.0">
    <title>CET Paper 1 Question 1</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
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
            background: #0B192C;
            color: #ffffff;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }}

        /* TOP THEMATIC HERO AREA (With Heritage Architecture & Study Elements) */
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

        /* Heritage Building & Sky Background */
        .heritage-backdrop {{
            position: absolute;
            inset: 0;
            background: 
                radial-gradient(circle at 65% 35%, rgba(245, 158, 11, 0.35) 0%, rgba(24, 59, 94, 0) 60%),
                linear-gradient(180deg, rgba(11, 25, 44, 0.4) 0%, rgba(11, 25, 44, 0.95) 100%);
            z-index: 1;
        }}

        /* Header Row */
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
            font-size: 54px;
            font-weight: 900;
            color: #FFFFFF;
            line-height: 1;
            letter-spacing: -1px;
            text-shadow: 0 4px 15px rgba(0,0,0,0.9);
        }}
        .main-subject-title span {{
            color: #FBBF24;
        }}
        .exam-sub-ribbon {{
            background: #DC2626;
            color: #FFFFFF;
            font-family: 'Poppins', sans-serif;
            font-size: 26px;
            font-weight: 900;
            padding: 6px 20px;
            border-radius: 8px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            box-shadow: 0 6px 15px rgba(220, 38, 38, 0.5);
        }}
        .for-exams-pill {{
            background: #FBBF24;
            color: #0F172A;
            font-family: 'Poppins', sans-serif;
            font-size: 19px;
            font-weight: 800;
            padding: 4px 16px;
            border-radius: 6px;
            letter-spacing: 0.5px;
        }}
        .target-chips {{
            background: #991B1B;
            color: #FFFBEB;
            font-family: 'Poppins', sans-serif;
            font-size: 17px;
            font-weight: 800;
            padding: 4px 16px;
            border-radius: 6px;
            letter-spacing: 1px;
            margin-top: 2px;
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

        /* HERO ELEMENTS ROW (Portrait / Plaque / Stack of Books) */
        .hero-elements-row {{
            position: relative;
            z-index: 10;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 20px;
            margin-top: 20px;
        }}

        /* Left Mascot / Teacher Card */
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
            position: relative;
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
            line-height: 1.15;
            color: #0F172A;
        }}
        .portrait-plaque p {{
            font-size: 13px;
            font-weight: 700;
            color: #475569;
        }}

        /* Center Golden Plaque */
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
            font-size: 28px;
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
            font-size: 16px;
            font-weight: 800;
            color: #92400E;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }}

        /* Right Stack of Luxury Hardbound Books */
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
            font-size: 15px;
            font-weight: 800;
            color: #FDE68A;
            letter-spacing: 1px;
            text-transform: uppercase;
            box-shadow: 0 6px 14px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
        }}

        /* BOTTOM QUIZ & ENGAGEMENT SECTION */
        .bottom-quiz-section {{
            position: relative;
            z-index: 20;
            padding: 0 45px 35px 45px;
            display: flex;
            flex-direction: column;
            gap: 22px;
        }}

        /* QUESTION CARD */
        .question-card-frame {{
            background: #FFFFFF;
            border-radius: 30px;
            padding: 45px 35px 30px 35px;
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
            font-size: 44px;
            font-weight: 900;
            line-height: 1.3;
            color: #0F172A;
            margin-bottom: 6px;
        }}
        .q-sub-title {{
            font-size: 26px;
            font-weight: 700;
            color: #475569;
        }}

        /* 4 OPTION CARDS (2x2 GRID) */
        .options-2x2-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
        }}
        .option-pill-card {{
            background: #FFFFFF;
            border-radius: 22px;
            padding: 22px 24px;
            display: flex;
            align-items: center;
            gap: 18px;
            box-shadow: 0 12px 28px rgba(0,0,0,0.35);
            border: 2.5px solid #E2E8F0;
        }}
        .opt-circle-num {{
            width: 62px;
            height: 62px;
            background: #DC2626;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Poppins', sans-serif;
            font-size: 32px;
            font-weight: 900;
            color: #FFFFFF;
            flex-shrink: 0;
            box-shadow: 0 6px 14px rgba(220, 38, 38, 0.45);
        }}
        .opt-content-text {{
            font-size: 32px;
            font-weight: 800;
            line-height: 1.15;
            color: #0F172A;
            text-align: left;
        }}

        /* CTA CHALLENGE BANNER */
        .cta-challenge-bar {{
            background: linear-gradient(90deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
            border: 2.5px solid #F43F5E;
            border-radius: 50px;
            padding: 16px 25px;
            text-align: center;
            font-size: 32px;
            font-weight: 900;
            color: #FFFFFF;
            box-shadow: 0 10px 25px rgba(244, 63, 94, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }}

        /* FEATURE 5 BADGES RIBBON */
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
        .feat-item {{
            display: flex;
            align-items: center;
            gap: 8px;
        }}

        /* BOTTOM SLOGAN BANNER */
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
            font-size: 40px;
            font-weight: 900;
            line-height: 1.15;
            letter-spacing: 0.5px;
        }}
        .slogan-channel {{
            font-family: 'Poppins', sans-serif;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 2px;
            color: #1E293B;
        }}

        /* HASHTAGS */
        .hashtags-row {{
            text-align: center;
            font-family: 'Poppins', sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: #94A3B8;
            letter-spacing: 1px;
            margin-top: -8px;
        }}
    </style>
</head>
<body>

    <!-- TOP HERO SECTION -->
    <div class="top-hero-section">
        <div class="heritage-backdrop"></div>

        <!-- Header Row -->
        <div class="header-top-row">
            <div class="brand-logo-wrap">
                <img src="http://localhost:3000/brand/examtwister_logo.png" alt="Exam Twister">
            </div>

            <div class="header-center-info">
                <div class="main-subject-title">HINDI <span>GRAMMAR</span></div>
                <div class="exam-sub-ribbon">CET 2024 MASTER PAPER 1</div>
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

        <!-- Hero Elements Row (Portrait + Plaque + Book Stack) -->
        <div class="hero-elements-row">
            <!-- Left Portrait Card -->
            <div class="hero-portrait-card">
                <div class="portrait-img-box">
                    <img src="http://localhost:3000/brand/examtwister_logo.png" alt="Mascot">
                </div>
                <div class="portrait-plaque">
                    <h4>RAJASTHAN EXAM TWISTER</h4>
                    <p>राजस्थान भर्ती परीक्षा स्पेशल 2024</p>
                </div>
            </div>

            <!-- Center Vintage Plaque -->
            <div class="hero-vintage-plaque">
                <div class="plaque-title">CET MASTER PAPER 1</div>
                <div class="plaque-year">2024</div>
                <div class="plaque-tagline">सामान्य हिंदी — सर्वनाम व भेद</div>
            </div>

            <!-- Right Book Stack -->
            <div class="hero-books-stack">
                <div class="book-spine">📖 SAMANYA HINDI</div>
                <div class="book-spine">📚 CET SYLLABUS 2024</div>
                <div class="book-spine">🎯 PREVIOUS YEAR Qs</div>
                <div class="book-spine">🏆 SELECTION SERIES</div>
            </div>
        </div>
    </div>

    <!-- BOTTOM QUIZ & ENGAGEMENT SECTION -->
    <div class="bottom-quiz-section">
        <!-- Main Question Card -->
        <div class="question-card-frame">
            <div class="q-circle-badge">Q.</div>
            <div class="q-main-title">{question_hi}</div>
            <div class="q-sub-title">{question_sub}</div>
        </div>

        <!-- 4 Option Cards (2x2 Grid) -->
        <div class="options-2x2-grid">
            <div class="option-pill-card">
                <div class="opt-circle-num">{options[0]['badge']}</div>
                <div class="opt-content-text">{options[0]['text']}</div>
            </div>
            <div class="option-pill-card">
                <div class="opt-circle-num">{options[1]['badge']}</div>
                <div class="opt-content-text">{options[1]['text']}</div>
            </div>
            <div class="option-pill-card">
                <div class="opt-circle-num">{options[2]['badge']}</div>
                <div class="opt-content-text">{options[2]['text']}</div>
            </div>
            <div class="option-pill-card">
                <div class="opt-circle-num">{options[3]['badge']}</div>
                <div class="opt-content-text">{options[3]['text']}</div>
            </div>
        </div>

        <!-- CTA Challenge Banner -->
        <div class="cta-challenge-bar">
            🧠 बिना Google किए अपना Option बताओ! 🎯
        </div>

        <!-- Feature 5 Badges Ribbon -->
        <div class="study-features-ribbon">
            <div class="feat-item">📖 STUDY SMARTER</div>
            <div class="feat-item">💡 PRACTICE REGULARLY</div>
            <div class="feat-item">📈 IMPROVE EVERYDAY</div>
            <div class="feat-item">👥 BE A TOPPER</div>
            <div class="feat-item">🏆 CRACK EXAMS</div>
        </div>

        <!-- Bottom Slogan Banner -->
        <div class="bottom-slogan-wrap">
            <div class="slogan-heading">सवाल सीधा नहीं, सोच टेढ़ी करो!</div>
            <div class="slogan-channel">RAJASTHAN EXAM TWISTER</div>
        </div>

        <!-- Hashtags Row -->
        <div class="hashtags-row">
            #RajasthanGK  #RajasthanCET  #CET2024  #HindiGrammar  #RPSC  #RAS  #REET  #CompetitiveExams
        </div>
    </div>

</body>
</html>"""

    html_file = "temp_ref_render.html"
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)

    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    abs_html = os.path.abspath(html_file)
    abs_out_insta = os.path.abspath(output_path)

    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--force-device-scale-factor=1",
        "--window-size=1080,1920",
        f"--screenshot={abs_out_insta}",
        f"file:///{abs_html}"
    ]
    subprocess.run(cmd, check=True)
    print("Generated reference style Reel image:", output_path)

    # Generate Twitter card (cropped 1:1 focused)
    im = Image.open(output_path)
    w, h = im.size
    crop_top = int(h * 0.22)
    crop_bottom = int(h * 0.82)
    cropped = im.crop((0, crop_top, w, crop_bottom))
    cropped.save(output_twitter, quality=95)
    print("Generated Twitter Card:", output_twitter)

    if os.path.exists(html_file):
        os.remove(html_file)

if __name__ == "__main__":
    opts = [
        {"badge": "A", "text": "प्रश्नवाचक"},
        {"badge": "B", "text": "संबंधवाचक"},
        {"badge": "C", "text": "निजवाचक"},
        {"badge": "D", "text": "अनिश्चयवाचक"}
    ]
    render_reference_style_graphic(
        question_hi="‘उसने कुछ नहीं खाया’ इसमें ‘कुछ’ कौन-सा सर्वनाम है?",
        question_sub="(निम्न में से सबसे उपयुक्त विकल्प चुनें)",
        options=opts
    )
