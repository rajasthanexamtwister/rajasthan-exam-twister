import os
import subprocess

def create_master_templates():
    artifact_dir = r"C:\Users\Chirag Bhoi\.gemini\antigravity-ide\brain\7f8ee892-d8de-4a28-8592-5f01f67bcd8c"
    out_var1 = os.path.join(artifact_dir, "master_reel_var1_standard.jpg")
    out_var2 = os.path.join(artifact_dir, "master_reel_var2_statement.jpg")
    
    logo_path = os.path.abspath(r"public/brand/logo.png").replace("\\", "/")

    # SVG Backgrounds for Rajasthan Fort, Jharokha Patterns & Desert
    svg_decorations = """
    <!-- Rajasthan Mehrangarh Fort Silhouette -->
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

    <!-- Traditional Rajasthani Jharokha Arch Overlay (Top) -->
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

    # SHARED CSS
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
            /* SAFE ZONES: 60px top, 40px left, 140px right (for Insta icons), 190px bottom (for caption) */
            padding: 60px 140px 180px 50px;
        }

        /* AMBIENT LIGHTING & GLOWS */
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
        .desert-mesh {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 480px;
            background: linear-gradient(180deg, transparent 0%, rgba(11, 19, 43, 0.6) 50%, rgba(5, 8, 17, 0.98) 100%);
            z-index: 1;
            pointer-events: none;
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

        /* MAIN CONTENT LAYER */
        .master-content {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            height: 100%;
            justify-content: space-between;
        }

        /* ==================== 1. TOP HEADER ==================== */
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

        /* ==================== 2. PROGRESS / TIMER BAR ==================== */
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
            width: 65%;
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

        /* ==================== 3. MAIN QUESTION PANEL ==================== */
        .question-panel-3d {
            margin-top: 20px;
            background: linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(24, 34, 53, 0.85) 100%);
            backdrop-filter: blur(28px);
            border: 2px solid rgba(245, 158, 11, 0.4);
            border-top: 5px solid #F59E0B;
            border-radius: 28px;
            padding: 34px 30px 28px 30px;
            position: relative;
            box-shadow: 
                0 25px 60px rgba(0, 0, 0, 0.8),
                0 0 35px rgba(245, 158, 11, 0.15),
                inset 0 1px 1px rgba(255, 255, 255, 0.25);
        }
        .q-floating-badge {
            position: absolute;
            top: -22px;
            left: 28px;
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            color: #070B19;
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 900;
            padding: 7px 22px;
            border-radius: 12px;
            border: 2px solid #FEF3C7;
            box-shadow: 0 8px 20px rgba(245, 158, 11, 0.6);
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .q-meta-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 14px;
        }
        .exam-target-chip {
            background: rgba(245, 158, 11, 0.12);
            border: 1px solid rgba(245, 158, 11, 0.4);
            padding: 4px 14px;
            border-radius: 10px;
            font-size: 17px;
            font-weight: 700;
            color: #FDE68A;
        }
        .q-body-hindi {
            font-size: 38px;
            font-weight: 800;
            line-height: 1.35;
            color: #FFFFFF;
            letter-spacing: 0.2px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
        }
        .q-body-hindi .highlight-keyword {
            color: #FDE047;
            background: rgba(245, 158, 11, 0.22);
            padding: 2px 8px;
            border-radius: 8px;
            border-bottom: 2px solid #F59E0B;
        }
        .q-body-english {
            margin-top: 12px;
            font-size: 21px;
            font-weight: 600;
            color: #94A3B8;
            line-height: 1.3;
        }

        /* ==================== 4. GAMING QUIZ OPTION BUTTONS ==================== */
        .options-stack {
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .option-card-gaming {
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.65) 100%);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.12);
            border-radius: 22px;
            padding: 16px 22px;
            display: flex;
            align-items: center;
            gap: 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
        }
        /* Electric gold side trim */
        .option-card-gaming::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 6px;
            height: 100%;
            background: linear-gradient(180deg, #F59E0B, #D97706);
            opacity: 0.8;
        }
        .option-key-badge {
            width: 58px;
            height: 58px;
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.35) 100%);
            border: 2px solid #F59E0B;
            color: #FDE68A;
            font-family: 'Outfit', sans-serif;
            font-size: 27px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.35);
        }
        .option-text-cluster {
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        .option-hindi-title {
            font-size: 30px;
            font-weight: 800;
            color: #F8FAFC;
            letter-spacing: 0.2px;
        }
        .option-english-sub {
            font-size: 19px;
            font-weight: 600;
            color: #94A3B8;
        }

        /* ==================== 5. EXAM TRAP SIGNATURE ==================== */
        .brand-trap-box {
            margin-top: 18px;
            background: linear-gradient(135deg, rgba(190, 18, 60, 0.25) 0%, rgba(245, 158, 11, 0.18) 100%);
            border: 2px dashed #F59E0B;
            border-radius: 20px;
            padding: 14px 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        }
        .trap-label {
            background: #F59E0B;
            color: #050811;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 900;
            padding: 5px 12px;
            border-radius: 8px;
            letter-spacing: 0.5px;
            flex-shrink: 0;
        }
        .trap-message {
            font-size: 21px;
            font-weight: 700;
            color: #FEF3C7;
            line-height: 1.3;
        }

        /* ==================== 6. BOTTOM ENGAGEMENT CTA ==================== */
        .bottom-cta-stack {
            margin-top: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .comment-trigger-pill {
            background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
            border: 2px solid #F59E0B;
            border-radius: 22px;
            padding: 15px 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.7);
        }
        .comment-lead-text {
            font-size: 24px;
            font-weight: 800;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .comment-action-badge {
            background: #F59E0B;
            color: #050811;
            font-family: 'Outfit', sans-serif;
            font-size: 17px;
            font-weight: 900;
            padding: 7px 16px;
            border-radius: 10px;
            letter-spacing: 0.5px;
        }
        .social-action-strip {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 10px 18px;
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 800;
            color: #CBD5E1;
            letter-spacing: 1px;
        }
        .action-chip {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .brand-footer-signature {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 8px;
            font-size: 17px;
            font-weight: 700;
            color: #94A3B8;
        }
        .footer-handle {
            color: #FCD34D;
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            letter-spacing: 0.5px;
        }
    """

    # ==================== VARIATION 1: STANDARD RAPID QUIZ ====================
    html_var1 = f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920">
    <title>Master Quiz Reel - Variation 1</title>
    <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@500;700;800;900&family=Outfit:wght@600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
    <style>
        {shared_css}
    </style>
</head>
<body>
    <div class="ambient-radial-gold"></div>
    <div class="ambient-radial-cyan"></div>
    <div class="cyber-grid"></div>
    <div class="desert-mesh"></div>
    {svg_decorations}

    <div class="master-content">
        <!-- 1. TOP BRAND HEADER -->
        <div class="top-brand-header">
            <div class="logo-wrap">
                <img src="file:///{logo_path}" class="official-logo-img" alt="Rajasthan Exam Twister Official Logo">
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
                <div class="category-sub-tag">RAJASTHAN GK • GEOGRAPHY</div>
            </div>
        </div>

        <!-- 2. TIMER / CHALLENGE PROGRESS BAR -->
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

        <!-- 3. MAIN QUESTION PANEL (Layered Navy & Gold) -->
        <div class="question-panel-3d">
            <div class="q-floating-badge">
                <span>🎯</span>
                <span>QUIZ CHALLENGE</span>
            </div>
            <div class="q-meta-row">
                <span class="exam-target-chip">CET 2024 / REET / Patwar Special</span>
            </div>
            <div class="q-body-hindi">
                2011 की जनगणना के अनुसार राजस्थान में <span class="highlight-keyword">सर्वाधिक लिंगानुपात</span> वाला जिला कौन-सा है?
            </div>
            <div class="q-body-english">
                (Which district has the highest sex ratio in Rajasthan according to Census 2011?)
            </div>
        </div>

        <!-- 4. GAMING QUIZ OPTION BUTTONS (A, B, C, D - No answer revealed!) -->
        <div class="options-stack">
            <div class="option-card-gaming">
                <div class="option-key-badge">A</div>
                <div class="option-text-cluster">
                    <div class="option-hindi-title">जयपुर जिला</div>
                    <div class="option-english-sub">Jaipur District</div>
                </div>
            </div>

            <div class="option-card-gaming">
                <div class="option-key-badge">B</div>
                <div class="option-text-cluster">
                    <div class="option-hindi-title">अलवर जिला</div>
                    <div class="option-english-sub">Alwar District</div>
                </div>
            </div>

            <div class="option-card-gaming">
                <div class="option-key-badge">C</div>
                <div class="option-text-cluster">
                    <div class="option-hindi-title">डूंगरपुर जिला</div>
                    <div class="option-english-sub">Dungarpur District</div>
                </div>
            </div>

            <div class="option-card-gaming">
                <div class="option-key-badge">D</div>
                <div class="option-text-cluster">
                    <div class="option-hindi-title">बीकानेर जिला</div>
                    <div class="option-english-sub">Bikaner District</div>
                </div>
            </div>
        </div>

        <!-- 5. SIGNATURE EXAM TRAP CALLOUT -->
        <div class="brand-trap-box">
            <div class="trap-label">⚠️ EXAM TRAP</div>
            <div class="trap-message">
                80% अभ्यर्थी यहाँ <b>डूंगरपुर (994)</b> और <b>राजसमंद (990)</b> में उलझकर -0.66 अंक गँवा देते हैं!
            </div>
        </div>

        <!-- 6. BOTTOM ENGAGEMENT CTA (With Safe Zones for Reel Buttons) -->
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

    # ==================== VARIATION 2: LONG STATEMENT / MATCHING QUESTION ====================
    html_var2 = f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920">
    <title>Master Quiz Reel - Variation 2 (Statement/Matching)</title>
    <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@500;700;800;900&family=Outfit:wght@600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
    <style>
        {shared_css}

        /* Specialized Layout for Statement Questions */
        .statements-box {{
            background: rgba(2, 6, 23, 0.6);
            border: 1.5px solid rgba(255, 255, 255, 0.1);
            border-radius: 18px;
            padding: 16px 20px;
            margin-top: 14px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }}
        .statement-row {{
            font-size: 24px;
            font-weight: 700;
            color: #F1F5F9;
            line-height: 1.3;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }}
        .statement-num {{
            background: rgba(245, 158, 11, 0.2);
            color: #FBBF24;
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 900;
            padding: 2px 10px;
            border-radius: 8px;
            flex-shrink: 0;
            border: 1px solid rgba(245, 158, 11, 0.4);
        }}
    </style>
</head>
<body>
    <div class="ambient-radial-gold"></div>
    <div class="ambient-radial-cyan"></div>
    <div class="cyber-grid"></div>
    <div class="desert-mesh"></div>
    {svg_decorations}

    <div class="master-content">
        <!-- 1. TOP BRAND HEADER -->
        <div class="top-brand-header">
            <div class="logo-wrap">
                <img src="file:///{logo_path}" class="official-logo-img" alt="Rajasthan Exam Twister Official Logo">
                <div class="brand-text-block">
                    <div class="brand-main-title">RAJASTHAN EXAM TWISTER</div>
                    <div class="brand-slogan-pill">
                        <span class="brand-slogan-text">सवाल सीधा नहीं, सोच टेढ़ी करो!</span>
                        <span>⚡</span>
                    </div>
                </div>
            </div>
            <div class="header-tags-cluster">
                <div class="quiz-pill-badge">HARD LEVEL • RPSC</div>
                <div class="category-sub-tag">RAJASTHAN HISTORY • 1857 REVOLT</div>
            </div>
        </div>

        <!-- 2. TIMER / CHALLENGE PROGRESS BAR -->
        <div class="timer-challenge-bar">
            <div class="timer-lead">
                <span>⏱️</span>
                <span>05s TIMER</span>
            </div>
            <div class="timer-track">
                <div class="timer-fill"></div>
            </div>
            <div class="timer-hook-text">
                <span>🔥 95% छात्र यहाँ गलती करते हैं!</span>
            </div>
        </div>

        <!-- 3. MAIN QUESTION PANEL (Statement / Matching Type) -->
        <div class="question-panel-3d">
            <div class="q-floating-badge">
                <span>⚖️</span>
                <span>कथन परीक्षण</span>
            </div>
            <div class="q-meta-row">
                <span class="exam-target-chip">RPSC RAS / SI / Patwar Tier-1</span>
            </div>
            <div class="q-body-hindi" style="font-size: 34px;">
                1857 की क्रांति के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए तथा <span class="highlight-keyword">सत्य कूट</span> चुनिए:
            </div>

            <!-- Nested Statement Box for Multi-line Questions -->
            <div class="statements-box">
                <div class="statement-row">
                    <span class="statement-num">1</span>
                    <span>नसीराबाद छावनी में विद्रोह का नेतृत्व 15वीं नेटिव इन्फैंट्री ने किया था।</span>
                </div>
                <div class="statement-row">
                    <span class="statement-num">2</span>
                    <span>आउवा के ठाकुर कुशाल सिंह ने बिथोड़ा के युद्ध में कैप्टन हीथकोट को पराजित किया।</span>
                </div>
            </div>
        </div>

        <!-- 4. GAMING QUIZ OPTION BUTTONS (A, B, C, D - No answer revealed!) -->
        <div class="options-stack">
            <div class="option-card-gaming">
                <div class="option-key-badge">A</div>
                <div class="option-text-cluster">
                    <div class="option-hindi-title">केवल कथन (1) सत्य है</div>
                    <div class="option-english-sub">Only statement (1) is true</div>
                </div>
            </div>

            <div class="option-card-gaming">
                <div class="option-key-badge">B</div>
                <div class="option-text-cluster">
                    <div class="option-hindi-title">केवल कथन (2) सत्य है</div>
                    <div class="option-english-sub">Only statement (2) is true</div>
                </div>
            </div>

            <div class="option-card-gaming">
                <div class="option-key-badge">C</div>
                <div class="option-text-cluster">
                    <div class="option-hindi-title">कथन (1) और (2) दोनों सत्य हैं</div>
                    <div class="option-english-sub">Both statements (1) and (2) are true</div>
                </div>
            </div>

            <div class="option-card-gaming">
                <div class="option-key-badge">D</div>
                <div class="option-text-cluster">
                    <div class="option-hindi-title">न तो (1) और न ही (2) सत्य है</div>
                    <div class="option-english-sub">Neither (1) nor (2) is true</div>
                </div>
            </div>
        </div>

        <!-- 5. SIGNATURE EXAM TRAP CALLOUT -->
        <div class="brand-trap-box">
            <div class="trap-label">🌀 TWISTER TRAP</div>
            <div class="trap-message">
                चेलावास और बिथोड़ा के युद्ध की तारीखों में छात्र अक्सर गच्चा खाते हैं! सोचकर जवाब दें।
            </div>
        </div>

        <!-- 6. BOTTOM ENGAGEMENT CTA -->
        <div class="bottom-cta-stack">
            <div class="comment-trigger-pill">
                <div class="comment-lead-text">
                    <span>💬</span>
                    <span>कमेंट में बताओ: A, B, C या D?</span>
                </div>
                <div class="comment-action-badge">PINNED COMMENT 👇</div>
            </div>

            <div class="social-action-strip">
                <div class="action-chip">💾 SAVE QUESTION</div>
                <div>•</div>
                <div class="action-chip">🚀 SHARE REEL</div>
                <div>•</div>
                <div class="action-chip">👥 TAG AN ASPIRANT</div>
            </div>

            <div class="brand-footer-signature">
                <div>📌 सही उत्तर व प्रामाणिक व्याख्या Pinned Comment में देखें</div>
                <div class="footer-handle">@RajasthanExamTwister</div>
            </div>
        </div>
    </div>
</body>
</html>"""

    # Write HTML files
    file_var1 = "temp_var1.html"
    file_var2 = "temp_var2.html"

    with open(file_var1, "w", encoding="utf-8") as f:
        f.write(html_var1)
    with open(file_var2, "w", encoding="utf-8") as f:
        f.write(html_var2)

    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    ]
    edge_exe = next((p for p in edge_paths if os.path.exists(p)), None)
    if not edge_exe:
        print("Edge not found")
        return

    # Render Var 1
    abs_html1 = os.path.abspath(file_var1)
    cmd1 = [
        edge_exe,
        "--headless",
        "--disable-gpu",
        "--force-device-scale-factor=1",
        "--window-size=1080,1920",
        f"--screenshot={out_var1}",
        f"file:///{abs_html1}"
    ]
    subprocess.run(cmd1, check=True)
    print("Rendered Variation 1:", out_var1)

    # Render Var 2
    abs_html2 = os.path.abspath(file_var2)
    cmd2 = [
        edge_exe,
        "--headless",
        "--disable-gpu",
        "--force-device-scale-factor=1",
        "--window-size=1080,1920",
        f"--screenshot={out_var2}",
        f"file:///{abs_html2}"
    ]
    subprocess.run(cmd2, check=True)
    print("Rendered Variation 2:", out_var2)

    for temp in [file_var1, file_var2]:
        if os.path.exists(temp):
            os.remove(temp)

if __name__ == "__main__":
    create_master_templates()
