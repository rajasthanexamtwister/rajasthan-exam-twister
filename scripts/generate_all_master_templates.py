import os
import sys
import io
import json
import subprocess

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def build_templates():
    artifact_dir = r"C:\Users\Chirag Bhoi\.gemini\antigravity-ide\brain\7f8ee892-d8de-4a28-8592-5f01f67bcd8c"
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
        1: "80% अभ्यर्थी यहाँ डूंगरपुर (994) और राजसमंद (990) में उलझकर -0.66 अंक गँवा देते हैं!",
        12: "75% छात्र यहाँ 'निरस' या 'निर्‌रस' चुनते हैं, जबकि विसर्ग के बाद 'र' आने पर स्वर दीर्घ होकर 'नीरस' बनता है!",
        13: "केवल ऑक्सीजन या केवल जल से जंग नहीं लगता, जंग (Fe₂O₃·xH₂O) के लिए O₂ + नमी दोनों अनिवार्य हैं!",
        14: "2 अक्टूबर 1959 को पं. नेहरू द्वारा राजस्थान के नागौर (बगदरी गाँव) में इसका ऐतिहासिक शुभारंभ हुआ था!",
        15: "'RRR' को लोकप्रिय फिल्म मिला, जबकि 69वीं 'सर्वश्रेष्ठ फीचर फिल्म' का अवॉर्ड 'रॉकेट्री: द नंबी इफेक्ट' को मिला!"
    }

    # =========================================================================
    # 1. SHARED ASSETS & CSS FOR 9:16 REEL (BALANCED PADDING, NO RIGHT GAP!)
    # =========================================================================
    reel_css = """
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
            /* BALANCED SAFE ZONES: 60px top, 55px right (REDUCED!), 160px bottom, 55px left */
            padding: 60px 55px 160px 55px;
        }
        .ambient-radial-gold {
            position: absolute;
            top: 250px;
            left: 50%;
            transform: translateX(-50%);
            width: 950px;
            height: 950px;
            background: radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.06) 45%, transparent 70%);
            pointer-events: none;
            z-index: 1;
        }
        .ambient-radial-cyan {
            position: absolute;
            bottom: 300px;
            left: 20%;
            width: 750px;
            height: 750px;
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
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%);
            backdrop-filter: blur(24px);
            border: 2px solid rgba(245, 158, 11, 0.45);
            border-radius: 28px;
            padding: 16px 28px;
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
            font-size: 35px;
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
            padding: 6px 20px;
            font-family: 'Outfit', sans-serif;
            font-size: 17px;
            font-weight: 900;
            color: #FFFFFF;
            letter-spacing: 1.2px;
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
            background: rgba(15, 23, 42, 0.85);
            border: 1.5px solid rgba(245, 158, 11, 0.4);
            border-radius: 18px;
            padding: 12px 24px;
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
            margin: 0 24px;
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
            background: linear-gradient(145deg, rgba(15, 23, 42, 0.94) 0%, rgba(24, 34, 53, 0.88) 100%);
            backdrop-filter: blur(28px);
            border: 2px solid rgba(245, 158, 11, 0.4);
            border-top: 5px solid #F59E0B;
            border-radius: 28px;
            padding: 34px 34px 28px 34px;
            position: relative;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(245, 158, 11, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.25);
        }
        .q-floating-badge {
            position: absolute;
            top: -20px;
            left: 32px;
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            color: #050811;
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 19px;
            padding: 5px 22px;
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
            font-size: 39px;
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
            font-size: 22px;
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
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.88) 0%, rgba(15, 23, 42, 0.95) 100%);
            border: 2px solid rgba(255, 255, 255, 0.15);
            border-left: 6px solid #F59E0B;
            border-radius: 20px;
            padding: 16px 26px;
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
            font-size: 31px;
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
            padding: 14px 24px;
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
            padding: 16px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #050811;
            font-weight: 900;
            box-shadow: 0 10px 30px rgba(245, 158, 11, 0.4);
        }
        .comment-lead-text {
            font-size: 25px;
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

    # =========================================================================
    # 2. DEDICATED X (TWITTER) 16:9 CARD CSS (1200 x 675 PX)
    # =========================================================================
    twitter_css = """
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            width: 1200px;
            height: 675px;
            background: #050811;
            color: #FFFFFF;
            font-family: 'Mukta', sans-serif;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 24px 36px 20px 36px;
        }
        .ambient-radial-gold {
            position: absolute;
            top: 50px;
            right: 100px;
            width: 700px;
            height: 700px;
            background: radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, transparent 60%);
            pointer-events: none;
            z-index: 1;
        }
        .ambient-radial-cyan {
            position: absolute;
            bottom: 20px;
            left: 50px;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 60%);
            pointer-events: none;
            z-index: 1;
        }
        .cyber-grid {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background-image: 
                radial-gradient(rgba(245, 158, 11, 0.1) 1.5px, transparent 1.5px),
                linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
            background-size: 35px 35px, 70px 70px, 70px 70px;
            z-index: 1;
            pointer-events: none;
        }
        .twitter-content {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            height: 100%;
            justify-content: space-between;
        }

        /* 1. TOP HEADER */
        .tw-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.82) 100%);
            border: 1.5px solid rgba(245, 158, 11, 0.45);
            border-radius: 18px;
            padding: 10px 20px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
        }
        .tw-logo-wrap {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .tw-logo-img {
            width: 58px;
            height: 58px;
            object-fit: contain;
            border-radius: 50%;
            filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.7));
        }
        .tw-brand-name {
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 1px;
            background: linear-gradient(135deg, #FFFFFF 0%, #FDE68A 50%, #F59E0B 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1.1;
        }
        .tw-brand-slogan {
            font-size: 14px;
            font-weight: 700;
            color: #FBBF24;
        }
        .tw-tags-cluster {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .tw-pill-badge {
            background: linear-gradient(135deg, #BE123C 0%, #9F1239 100%);
            border: 1px solid #FDE68A;
            border-radius: 10px;
            padding: 5px 14px;
            font-family: 'Outfit', sans-serif;
            font-size: 13px;
            font-weight: 900;
            color: #FFFFFF;
            letter-spacing: 0.8px;
        }
        .tw-timer-chip {
            background: rgba(15, 23, 42, 0.9);
            border: 1.5px solid #F59E0B;
            border-radius: 10px;
            padding: 5px 14px;
            font-family: 'Outfit', sans-serif;
            font-size: 13px;
            font-weight: 900;
            color: #FEF3C7;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        /* 2. MAIN QUESTION CARD */
        .tw-question-panel {
            background: linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(24, 34, 53, 0.9) 100%);
            border: 1.5px solid rgba(245, 158, 11, 0.4);
            border-top: 4px solid #F59E0B;
            border-radius: 20px;
            padding: 16px 24px;
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.7);
            position: relative;
        }
        .tw-q-badge {
            position: absolute;
            top: -14px;
            left: 24px;
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            color: #050811;
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 13px;
            padding: 3px 14px;
            border-radius: 8px;
            letter-spacing: 0.8px;
        }
        .tw-q-meta {
            font-size: 13px;
            font-weight: 700;
            color: #94A3B8;
            margin-bottom: 6px;
            margin-top: 4px;
        }
        .tw-q-hindi {
            font-size: 26px;
            font-weight: 800;
            line-height: 1.3;
            color: #FFFFFF;
        }
        .tw-q-english {
            font-size: 16px;
            font-weight: 600;
            color: #94A3B8;
            font-style: italic;
            margin-top: 4px;
        }
        .highlight-keyword {
            color: #FDE047;
            text-decoration: underline;
            text-decoration-color: #F59E0B;
            text-decoration-thickness: 2.5px;
            text-underline-offset: 4px;
        }

        /* 3. OPTIONS GRID (2 x 2) */
        .tw-options-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 18px;
            margin-top: 4px;
        }
        .tw-opt-card {
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%);
            border: 1.5px solid rgba(255, 255, 255, 0.12);
            border-left: 5px solid #F59E0B;
            border-radius: 14px;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 14px;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
        }
        .tw-opt-key {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
            border: 1.5px solid #F59E0B;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 900;
            color: #FDE68A;
            flex-shrink: 0;
        }
        .tw-opt-text {
            font-size: 20px;
            font-weight: 800;
            color: #FFFFFF;
            line-height: 1.2;
        }

        /* 4. BOTTOM BAR */
        .tw-bottom-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 8px 18px;
        }
        .tw-trap-tag {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 700;
            color: #FDE68A;
        }
        .tw-trap-badge {
            background: #BE123C;
            color: #FFFFFF;
            font-family: 'Outfit', sans-serif;
            font-size: 11px;
            font-weight: 900;
            padding: 3px 8px;
            border-radius: 6px;
        }
        .tw-reply-cta {
            font-size: 15px;
            font-weight: 800;
            color: #38BDF8;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .tw-handle {
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 800;
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

    target_questions = [1, 12, 13, 14, 15]

    for item in history:
        q_num = item.get("questionNumber")
        if q_num not in target_questions:
            continue

        q_id = item.get("id")
        q_hi = item.get("questionHi") or item.get("questionText", "")
        q_en = item.get("questionEn") or item.get("questionTextEn", "")
        subj = item.get("subject", "RAJASTHAN GK")
        options = item.get("options", [])
        trap_msg = traps.get(q_num, "बिना सोचे समझे उत्तर न दें, Pinned Comment में सही उत्तर व व्याख्या देखें!")

        # ---------------------------------------------------------------------
        # A. RENDER 9:16 REEL (BALANCED PADDING, NO RIGHT GAP!)
        # ---------------------------------------------------------------------
        opts_reel_html = ""
        for opt in options:
            key = opt.get("key", "")
            text = opt.get("text", "")
            opts_reel_html += f"""
            <div class="option-card-gaming">
                <div class="option-key-badge">{key}</div>
                <div class="option-text-cluster">
                    <div class="option-hindi-title">{text}</div>
                </div>
            </div>
            """

        reel_html = f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920">
    <title>Master Reel - Q{q_num}</title>
    <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@500;700;800;900&family=Outfit:wght@600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
    <style>{reel_css}</style>
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
            <div class="q-body-hindi">{q_hi}</div>
            {f'<div class="q-body-english">{q_en}</div>' if q_en else ''}
        </div>

        <div class="options-stack">{opts_reel_html}</div>

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

        # ---------------------------------------------------------------------
        # B. RENDER 16:9 X (TWITTER) CARD
        # ---------------------------------------------------------------------
        opts_tw_html = ""
        for opt in options:
            key = opt.get("key", "")
            text = opt.get("text", "")
            opts_tw_html += f"""
            <div class="tw-opt-card">
                <div class="tw-opt-key">{key}</div>
                <div class="tw-opt-text">{text}</div>
            </div>
            """

        twitter_html = f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1200, height=675">
    <title>X / Twitter Card - Q{q_num}</title>
    <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@500;700;800;900&family=Outfit:wght@600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
    <style>{twitter_css}</style>
</head>
<body>
    <div class="ambient-radial-gold"></div>
    <div class="ambient-radial-cyan"></div>
    <div class="cyber-grid"></div>

    <div class="twitter-content">
        <div class="tw-header">
            <div class="tw-logo-wrap">
                <img src="file:///{logo_path}" class="tw-logo-img" alt="Official Logo">
                <div>
                    <div class="tw-brand-name">RAJASTHAN EXAM TWISTER</div>
                    <div class="tw-brand-slogan">सवाल सीधा नहीं, सोच टेढ़ी करो! ⚡</div>
                </div>
            </div>
            <div class="tw-tags-cluster">
                <div class="tw-timer-chip">⏱️ 05s TIMER</div>
                <div class="tw-pill-badge">DAILY QUIZ</div>
            </div>
        </div>

        <div class="tw-question-panel">
            <div class="tw-q-badge">🎯 QUIZ CHALLENGE</div>
            <div class="tw-q-meta">CET 2024 / REET / Patwar Special • {subj.split('|')[0].strip()}</div>
            <div class="tw-q-hindi">{q_hi}</div>
            {f'<div class="tw-q-english">{q_en}</div>' if q_en else ''}
        </div>

        <div class="tw-options-grid">
            {opts_tw_html}
        </div>

        <div class="tw-bottom-bar">
            <div class="tw-trap-tag">
                <span class="tw-trap-badge">⚠️ EXAM TRAP</span>
                <span>{trap_msg[:75]}...</span>
            </div>
            <div class="tw-reply-cta">
                <span>💬 Reply with (A, B, C or D)</span>
            </div>
            <div class="tw-handle">@RajasthanExamTwister</div>
        </div>
    </div>
</body>
</html>"""

        # Write temp files
        tmp_reel = f"temp_reel_q{q_num}.html"
        tmp_tw = f"temp_tw_q{q_num}.html"
        with open(tmp_reel, "w", encoding="utf-8") as f:
            f.write(reel_html)
        with open(tmp_tw, "w", encoding="utf-8") as f:
            f.write(twitter_html)

        # Output targets
        out_reel = os.path.abspath(f"public/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-{q_num}/reel_9_16.jpg")
        out_tw = os.path.abspath(f"public/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-{q_num}/twitter_card.jpg")
        os.makedirs(os.path.dirname(out_reel), exist_ok=True)

        # 1. Render Reel (1080x1920)
        cmd_reel = [
            edge_exe,
            "--headless",
            "--disable-gpu",
            "--force-device-scale-factor=1",
            "--window-size=1080,1920",
            f"--screenshot={out_reel}",
            f"file:///{os.path.abspath(tmp_reel)}"
        ]
        subprocess.run(cmd_reel, check=True)
        print(f"✅ Rendered Q{q_num} Reel (Balanced Padding): {out_reel}")

        # 2. Render Twitter Card (1200x675)
        cmd_tw = [
            edge_exe,
            "--headless",
            "--disable-gpu",
            "--force-device-scale-factor=1",
            "--window-size=1200,675",
            f"--screenshot={out_tw}",
            f"file:///{os.path.abspath(tmp_tw)}"
        ]
        subprocess.run(cmd_tw, check=True)
        print(f"✅ Rendered Q{q_num} Twitter Card (16:9 Landscape): {out_tw}")

        # Also copy showcase master for artifact directory if Q1
        if q_num == 1:
            showcase_reel = os.path.join(artifact_dir, "master_reel_var1_standard.jpg")
            showcase_tw = os.path.join(artifact_dir, "master_twitter_var1.jpg")
            import shutil
            shutil.copy(out_reel, showcase_reel)
            shutil.copy(out_tw, showcase_tw)
            print(f"Updated showcase in artifacts: {showcase_reel} and {showcase_tw}")

        for tf in [tmp_reel, tmp_tw]:
            if os.path.exists(tf):
                os.remove(tf)

        # Update URLs with cache buster in history
        item["instagramImageUrl"] = f"/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-{q_num}/reel_9_16.jpg?v=balanced_{q_num}"
        item["twitterImageUrl"] = f"/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-{q_num}/twitter_card.jpg?v=tw_{q_num}"

        # Update kit.json as well
        kit_file = os.path.abspath(f"public/uploads/social-kits/rajasthan-cet-sr-secondary/2024/question-{q_num}/kit.json")
        if os.path.exists(kit_file):
            with open(kit_file, "r", encoding="utf-8") as kf:
                kdata = json.load(kf)
            kdata["instagramImageUrl"] = item["instagramImageUrl"]
            kdata["twitterImageUrl"] = item["twitterImageUrl"]
            with open(kit_file, "w", encoding="utf-8") as kf:
                json.dump(kdata, kf, ensure_ascii=False, indent=2)

    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print("\n🎉 ALL MASTER REELS & TWITTER CARDS SUCCESSFULLY GENERATED & UPDATED!")

if __name__ == "__main__":
    build_templates()
