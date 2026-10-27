import os
import sys
import io
import json
import subprocess
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

questions_data = [
    {
        "num": 36,
        "id": "raj-culture-q36",
        "date": "27 Oct 2026",
        "subject": "RAJASTHAN ART & CULTURE | कला एवं संस्कृति",
        "topic": "राजस्थान के ऐतिहासिक दुर्ग एवं स्मारक (विजय स्तंभ, चित्तौड़गढ़)",
        "questionHi": "मालवा विजय (सारंगपुर युद्ध, 1437 ई.) के उपलक्ष्य में महाराणा कुंभा द्वारा निर्मित 'विजय स्तंभ' (कीर्ति स्तंभ) कितने मंजिला है तथा इसके मुख्य शिल्पी/वास्तुकार कौन थे?",
        "questionEn": "(How many storeys is the 'Vijay Stambh' built by Maharana Kumbha to commemorate the victory of Sarangpur, and who was its chief architect?)",
        "options": [
            {"key": "A", "text": "7 मंजिला, वास्तुकार मण्डन", "isCorrect": False},
            {"key": "B", "text": "9 मंजिला, वास्तुकार जैता व पुत्र (नापा, पोमा)", "isCorrect": True},
            {"key": "C", "text": "11 मंजिला, वास्तुकार लालचंद", "isCorrect": False},
            {"key": "D", "text": "5 मंजिला, वास्तुकार सोढा", "isCorrect": False}
        ],
        "correctOption": "B",
        "explanation": "विजय स्तंभ चित्तौड़गढ़ दुर्ग में स्थित 122 फीट ऊँचा, 9-मंजिला भव्य स्मारक है। इसका निर्माण महाराणा कुंभा ने मालवा के सुल्तान महमूद खिलजी पर विजय (1437 ई.) के उपलक्ष्य में करवाया था। इसके मुख्य शिल्पी 'जैता' तथा उनके पुत्र नापा, पोमा व पूंजा थे। इसे 'भारतीय मूर्तिकला का विश्वकोश' व 'मूर्तियों का अजायबघर' कहा जाता है। 15 अगस्त 1949 को इस पर 1 रुपये का डाक टिकट जारी हुआ था, जो राजस्थान की पहली इमारत है जिस पर डाक टिकट जारी हुआ। यह राजस्थान पुलिस व माध्यमिक शिक्षा बोर्ड का प्रतीक चिह्न भी है।",
        "aiPrompt": "Vertical 9:16 majestic golden hour architectural view of the 9-storey carved marble and red sandstone Vijay Stambh (Tower of Victory) in Chittorgarh Fort, intricate Hindu deity sculptures on stone walls, flock of doves taking flight under crimson dusk sky, royal Rajput flags fluttering, 8k ultra-detailed photorealistic cinematic heritage, no text."
    },
    {
        "num": 37,
        "id": "raj-culture-q37",
        "date": "27 Oct 2026",
        "subject": "RAJASTHAN ART & CULTURE | कला एवं संस्कृति",
        "topic": "राजस्थान के प्रमुख दुर्ग (कुंभलगढ़ दुर्ग, राजसमंद)",
        "questionHi": "राजस्थान के किस दुर्ग के भीतर स्थित अंतःदुर्ग 'कटारगढ़' को 'मेवाड़ की आँख' (Eye of Mewar) कहा जाता है, जहाँ वीर शिरोमणि महाराणा प्रताप का जन्म हुआ था?",
        "questionEn": "(The inner fortress 'Katargarh' of which Rajasthani fort is revered as the 'Eye of Mewar', being the historic birthplace of Maharana Pratap?)",
        "options": [
            {"key": "A", "text": "अचलगढ़ दुर्ग (सिरोही)", "isCorrect": False},
            {"key": "B", "text": "कुंभलगढ़ दुर्ग (राजसमंद)", "isCorrect": True},
            {"key": "C", "text": "मांडलगढ़ दुर्ग (भीलवाड़ा)", "isCorrect": False},
            {"key": "D", "text": "सज्जनगढ़ दुर्ग (उदयपुर)", "isCorrect": False}
        ],
        "correctOption": "B",
        "explanation": "कुंभलगढ़ दुर्ग (राजसमंद) का निर्माण महाराणा कुंभा ने अपनी पत्नी कुंभलदेवी की स्मृति में शिल्पी मण्डन की देखरेख में करवाया था। इस दुर्ग का सबसे ऊँचा भाग 'कटारगढ़' कहलाता है जो महाराणा कुंभा का निवास स्थान था, इसे 'मेवाड़ की आँख' कहते हैं। कटारगढ़ के 'बादल महल' की 'जूंनी कचहरी' में 9 मई 1540 को महाराणा प्रताप का जन्म हुआ था। इस दुर्ग की प्राचीर 36 किमी लंबी और इतनी चौड़ी है कि उस पर 4 घुड़सवार एक साथ चल सकते हैं, इसे 'भारत की महान दीवार' (Great Wall of India) कहा जाता है।",
        "aiPrompt": "Vertical 9:16 awe-inspiring aerial panoramic view of Kumbhalgarh Fort and its serpentine 36-kilometer Great Wall of India winding across lush green Aravalli ridges at sunrise. The crown fortress Katargarh piercing the morning mist, dramatic mountain fortress scale, 8k cinematic realism, no text."
    },
    {
        "num": 38,
        "id": "raj-culture-q38",
        "date": "27 Oct 2026",
        "subject": "RAJASTHAN ART & CULTURE | कला एवं संस्कृति",
        "topic": "राजस्थान के ऐतिहासिक दुर्ग (रणथंभौर दुर्ग, सवाई माधोपुर)",
        "questionHi": "'तिरिया तेल हम्मीर हठ, चढ़े न दूजी बार' - यह प्रसिद्ध लोकोक्ति 1301 ई. में अलाउद्दीन खिलजी के विरुद्ध राजस्थान का प्रथम साका करने वाले रणथंभौर के किस पराक्रमी शासक से संबंधित है?",
        "questionEn": "(The famous historical proverb 'Tiriya Tel Hammir Hath...' is associated with which valorous ruler of Ranthambore who led Rajasthan's first Saka against Alauddin Khalji in 1301 AD?)",
        "options": [
            {"key": "A", "text": "पृथ्वीराज चौहान तृतीय", "isCorrect": False},
            {"key": "B", "text": "राव हम्मीर देव चौहान", "isCorrect": True},
            {"key": "C", "text": "कान्हड़देव सोनगरा", "isCorrect": False},
            {"key": "D", "text": "वीर सातलदेव चौहान", "isCorrect": False}
        ],
        "correctOption": "B",
        "explanation": "रणथंभौर दुर्ग (सवाई माधोपुर) अपनी प्राकृतिक अभेद्यता के कारण 'बख्तरबंद दुर्ग' कहलाता है (अबुल फजल ने कहा: 'अन्य सब दुर्ग नंगे हैं, जबकि यह बख्तरबंद है')। यहाँ 11 जुलाई 1301 को अलाउद्दीन खिलजी के आक्रमण के समय राव हम्मीर देव चौहान के नेतृत्व में केसरिया हुआ तथा रानी रंगदेवी के नेतृत्व में राजस्थान का प्रथम जल जौहर (पद्मला तालाब) हुआ। इस दुर्ग में भारत का एकमात्र 'त्रिनेत्र गणेश जी' का प्रसिद्ध मंदिर, जोगी महल व 32 खंभों की छतरी (हम्मीर की कचहरी) स्थित है।",
        "aiPrompt": "Vertical 9:16 ancient impregnable Ranthambore Fort perched atop forested cliffs inside tiger reserve, ancient stone gateway and Jogi Mahal by the lotus pond, historic Rajput bastion under golden afternoon sunlight, wild peacocks, 8k hyper-realistic atmospheric heritage landscape, no text."
    },
    {
        "num": 39,
        "id": "raj-culture-q39",
        "date": "27 Oct 2026",
        "subject": "RAJASTHAN ART & CULTURE | कला एवं संस्कृति",
        "topic": "राजस्थान के प्रमुख दुर्ग (गागरोन दुर्ग, झालावाड़ - ओदक दुर्ग)",
        "questionHi": "राजस्थान का सर्वश्रेष्ठ जल दुर्ग (ओदक दुर्ग) 'गागरोन का किला' किन दो नदियों के पावन संगम (सामेला) पर बिना किसी नींव के एक सीधी चट्टान पर स्थित है?",
        "questionEn": "(The premier water fortress 'Gagron Fort' of Rajasthan stands without an artificial foundation on a solid rocky bluff at the sacred confluence of which two rivers?)",
        "options": [
            {"key": "A", "text": "चम्बल और बामनी नदी", "isCorrect": False},
            {"key": "B", "text": "आहू और कालीसिंध नदी", "isCorrect": True},
            {"key": "C", "text": "बनास और बेड़च नदी", "isCorrect": False},
            {"key": "D", "text": "सोम और जाखम नदी", "isCorrect": False}
        ],
        "correctOption": "B",
        "explanation": "गागरोन दुर्ग (झालावाड़) आहू और कालीसिंध नदियों के संगम (सामेला) पर तीन तरफ से पानी से घिरा विश्वप्रसिद्ध जल दुर्ग (ओदक दुर्ग) है। यह राजस्थान का एकमात्र ऐसा दुर्ग है जो बिना किसी नींव के एक विशाल प्राकृतिक चट्टान पर खड़ा है। 2013 में यूनेस्को ने इसे विश्व धरोहर सूची में शामिल किया। यहाँ संत पीपा जी की छतरी, सूफी संत हमीदुद्दीन चिश्ती (मीठे शाह) की दरगाह तथा कोटा राज्य की प्रसिद्ध टकसाल स्थित थी। यहाँ का पहला साका 1423 ई. में अचलदास खींची के समय हुआ था।",
        "aiPrompt": "Vertical 9:16 breathtaking river confluence view of the UNESCO world heritage Gagron Water Fort in Jhalawar. Ancient stone battlements surrounded on three sides by turquoise flowing waters of Ahu and Kalisindh rivers, lush green riverbanks, golden twilight reflections on water, 8k cinematic perfection, no text."
    },
    {
        "num": 40,
        "id": "raj-culture-q40",
        "date": "27 Oct 2026",
        "subject": "RAJASTHAN ART & CULTURE | कला एवं संस्कृति",
        "topic": "राजस्थान के प्रमुख स्मारक (हवा महल, जयपुर)",
        "questionHi": "जयपुर के विश्वप्रसिद्ध 5-मंजिला 'हवा महल' का निर्माण 1799 ई. में सवाई प्रताप सिंह ने करवाया था, इसके प्रधान वास्तुकार कौन थे तथा इसमें कुल कितनी खिड़कियाँ/झरोखे हैं?",
        "questionEn": "(Built in 1799 AD by Sawai Pratap Singh, who was the chief architect of Jaipur's iconic 5-storey Hawa Mahal and how many ornate casements/jharokhas does it have?)",
        "options": [
            {"key": "A", "text": "वास्तुकार विद्याधर भट्टाचार्य, 500 झरोखे", "isCorrect": False},
            {"key": "B", "text": "वास्तुकार लालचंद उस्ता, 953 झरोखे", "isCorrect": True},
            {"key": "C", "text": "वास्तुकार मण्डन, 750 झरोखे", "isCorrect": False},
            {"key": "D", "text": "वास्तुकार अहमद लाहौरी, 1001 झरोखे", "isCorrect": False}
        ],
        "correctOption": "B",
        "explanation": "हवा महल (जयपुर) का निर्माण 1799 ई. में सवाई प्रताप सिंह द्वारा भगवान श्रीकृष्ण के मुकुट के आकार में करवाया गया था। इसके प्रमुख वास्तुकार लालचंद उस्ता थे। यह 5-मंजिला इमारत बिना किसी नींव के सीधे धरातल पर खड़ी है। इसमें 953 नक्काशीदार खिड़कियाँ/झरोखे तथा 365 छोटी खिड़कियाँ हैं। इसकी पाँचों मंजिलों के नाम क्रमशः (नीचे से ऊपर): 1. शरद/प्रताप मंदिर, 2. रतन मंदिर, 3. विचित्र मंदिर, 4. प्रकाश मंदिर, 5. हवा मंदिर हैं। राजपरिवार की रानियाँ व महिलाएँ पर्दा प्रथा का पालन करते हुए यहाँ से शहर के तीज-गणगौर के जुलूस देखती थीं।",
        "aiPrompt": "Vertical 9:16 stunning frontal close-up view of the iconic pink sandstone honeycomb facade of Hawa Mahal (Palace of Winds) in Jaipur, 953 intricate carved jharokha windows illuminated by morning pink dawn, bustling heritage street with royal pigeons, 8k photorealistic architectural perfection, no text."
    }
]

edge_paths = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
]
edge_exe = next((p for p in edge_paths if os.path.exists(p)), None)
if not edge_exe:
    print("Edge executable not found.")
    exit(1)

for q in questions_data:
    q_num = q["num"]
    out_dir = os.path.abspath(f"public/uploads/social-kits/rajasthan-culture/question-{q_num}")
    os.makedirs(out_dir, exist_ok=True)
    reel_path = os.path.join(out_dir, "reel_9_16.jpg")
    crop_path = os.path.join(out_dir, "paper_crop.jpg")

    opt_html = ""
    for o in q["options"]:
        opt_html += f"""
        <div class="opt-btn">
            <span class="opt-key">{o['key']}</span>
            <span class="opt-text">{o['text']}</span>
        </div>
        """

    # 1. HTML for 9:16 Reel (1080x1920)
    reel_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * {{ margin:0; padding:0; box-sizing:border-box; }}
        body {{
            width:1080px; height:1920px;
            background: linear-gradient(180deg, #060b18 0%, #0c1527 35%, #050a14 100%);
            font-family:'Mukta', sans-serif;
            color:#ffffff;
            display:flex; flex-direction:column; justify-content:space-between;
            padding:60px 55px 120px 55px;
            position:relative; overflow:hidden;
        }}
        .bg-glow {{
            position:absolute; width:650px; height:650px;
            background:radial-gradient(circle, rgba(234, 179, 8, 0.16) 0%, rgba(2, 6, 23, 0) 70%);
            top:150px; left:50%; transform:translateX(-50%); pointer-events:none;
        }}
        .header {{
            display:flex; align-items:center; justify-content:space-between;
            background:rgba(15, 23, 42, 0.75); border:1px solid rgba(234, 179, 8, 0.35);
            padding:20px 30px; border-radius:24px;
        }}
        .badge {{
            font-family:'Outfit', sans-serif; font-size:26px; font-weight:800;
            background:linear-gradient(135deg, #eab308, #ca8a04);
            color:#020617; padding:8px 24px; border-radius:50px;
            text-transform:uppercase; letter-spacing:1px;
        }}
        .sub-badge {{ font-size:24px; font-weight:700; color:#cbd5e1; }}
        .q-card {{
            background:linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
            border:2px solid #eab308; border-radius:32px;
            padding:45px 40px; box-shadow:0 25px 60px rgba(0, 0, 0, 0.6);
            position:relative;
        }}
        .q-tag {{
            font-size:24px; font-weight:800; color:#fde047;
            text-transform:uppercase; margin-bottom:15px; display:flex; align-items:center; gap:10px;
        }}
        .q-text-hi {{ font-size:42px; font-weight:800; line-height:1.45; color:#ffffff; margin-bottom:15px; }}
        .q-text-en {{ font-size:25px; font-weight:600; line-height:1.35; color:#94a3b8; font-style:italic; }}
        .options-grid {{ display:flex; flex-direction:column; gap:20px; }}
        .opt-btn {{
            display:flex; align-items:center; gap:25px;
            background:rgba(30, 41, 59, 0.75); border:1.5px solid rgba(203, 213, 225, 0.2);
            padding:22px 28px; border-radius:22px;
        }}
        .opt-key {{
            width:54px; height:54px; border-radius:16px;
            background:rgba(234, 179, 8, 0.15); border:1.5px solid #eab308;
            color:#fde047; font-family:'Outfit', sans-serif; font-size:30px; font-weight:900;
            display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }}
        .opt-text {{ font-size:34px; font-weight:700; color:#f1f5f9; }}
        .footer-cta {{
            background:rgba(15, 23, 42, 0.85); border:1.5px solid rgba(234, 179, 8, 0.4);
            border-radius:24px; padding:22px 30px; text-align:center;
        }}
        .cta-txt {{ font-size:30px; font-weight:800; color:#fde047; }}
        .sub-txt {{ font-size:22px; color:#94a3b8; font-weight:600; margin-top:5px; }}
    </style>
</head>
<body>
    <div class="bg-glow"></div>
    <div class="header">
        <div class="badge">Question #{q_num}</div>
        <div class="sub-badge">{q['topic']}</div>
    </div>
    <div class="q-card">
        <div class="q-tag">🎯 RPSC / RSSB EXAM SPECIAL</div>
        <div class="q-text-hi">{q['questionHi']}</div>
        <div class="q-text-en">{q['questionEn']}</div>
    </div>
    <div class="options-grid">
        {opt_html}
    </div>
    <div class="footer-cta">
        <div class="cta-txt">⏱️ बिना Google किए उत्तर कमेंट करें (A, B, C या D)!</div>
        <div class="sub-txt">📌 सही उत्तर व प्रामाणिक व्याख्या पहले Pinned Comment में देखें!</div>
    </div>
</body>
</html>"""

    temp_reel_html = os.path.abspath(f"temp_reel_{q_num}.html")
    with open(temp_reel_html, "w", encoding="utf-8") as f:
        f.write(reel_html)

    subprocess.run([
        edge_exe, "--headless", "--disable-gpu",
        "--force-device-scale-factor=1",
        f"--window-size=1080,1920",
        f"--screenshot={reel_path}",
        temp_reel_html
    ], capture_output=True)

    if os.path.exists(temp_reel_html):
        os.remove(temp_reel_html)

    # 2. HTML for 16:9 Paper Crop (1200x675)
    opt_paper_html = ""
    for o in q["options"]:
        opt_paper_html += f"""
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px; font-size:24px; font-weight:700;">
            <span style="display:inline-block; width:34px; height:34px; text-align:center; line-height:30px; border:1.5px solid #0f172a; border-radius:50%; font-family:'Outfit'; font-weight:800; font-size:18px;">{o['key']}</span>
            <span>{o['text']}</span>
        </div>
        """

    paper_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
    <style>
        * {{ margin:0; padding:0; box-sizing:border-box; }}
        body {{
            width:1200px; height:675px;
            background:#ffffff; color:#0f172a;
            font-family:'Mukta', sans-serif;
            padding:35px 50px;
            display:flex; flex-direction:column; justify-content:space-between;
            border:10px solid #f1f5f9;
        }}
        .exam-header {{
            display:flex; justify-content:space-between; align-items:center;
            border-bottom:2px dashed #94a3b8; padding-bottom:12px; margin-bottom:15px;
        }}
        .q-num {{
            font-family:'Outfit', sans-serif; font-size:26px; font-weight:900;
            background:#0f172a; color:#ffffff; padding:4px 16px; border-radius:8px;
        }}
        .q-box {{ margin-bottom:15px; }}
        .q-hi {{ font-size:29px; font-weight:800; line-height:1.35; color:#0f172a; margin-bottom:6px; }}
        .q-en {{ font-size:19px; font-weight:600; color:#475569; font-style:italic; line-height:1.25; }}
        .opt-grid {{ display:grid; grid-template-columns:1fr 1fr; gap:10px 40px; margin-top:15px; }}
        .watermark {{
            display:flex; justify-content:space-between; align-items:center;
            border-top:1.5px solid #e2e8f0; padding-top:10px; font-size:17px; font-weight:700; color:#64748b;
        }}
    </style>
</head>
<body>
    <div class="exam-header">
        <div style="font-weight:800; font-size:20px; color:#475569;">RAJASTHAN ART & CULTURE • EXAM REVISION</div>
        <div class="q-num">Q.{q_num}</div>
    </div>
    <div class="q-box">
        <div class="q-hi">{q['questionHi']}</div>
        <div class="q-en">{q['questionEn']}</div>
        <div class="opt-grid">
            {opt_paper_html}
        </div>
    </div>
    <div class="watermark">
        <span>Rajasthan Exam Twister Official Question Series</span>
        <span>राजस्थान लोक सेवा आयोग / कर्मचारी चयन बोर्ड पैटर्न</span>
    </div>
</body>
</html>"""

    temp_paper_html = os.path.abspath(f"temp_paper_{q_num}.html")
    with open(temp_paper_html, "w", encoding="utf-8") as f:
        f.write(paper_html)

    subprocess.run([
        edge_exe, "--headless", "--disable-gpu",
        "--force-device-scale-factor=1",
        f"--window-size=1200,675",
        f"--screenshot={crop_path}",
        temp_paper_html
    ], capture_output=True)

    if os.path.exists(temp_paper_html):
        os.remove(temp_paper_html)

    reel_size = os.path.getsize(reel_path) if os.path.exists(reel_path) else 0
    crop_size = os.path.getsize(crop_path) if os.path.exists(crop_path) else 0
    print(f"✅ Rendered Q{q_num}: Reel={reel_size}b, PaperCrop={crop_size}b")

# Update social_posts_history.json
history_path = "public/uploads/social_posts_history.json"
with open(history_path, "r", encoding="utf-8") as f:
    posts = json.load(f)

# First mark Q31-Q35 as uploaded with sequence 31-35
for p in posts:
    num = p.get("questionNumber")
    if num and 31 <= num <= 35:
        p["uploadSequence"] = num
        p["status"] = {
            "instagramUploaded": True,
            "instagramUploadedAt": "2026-10-27T18:00:00.000Z",
            "twitterPosted": True,
            "uploadedAt": "2026-10-27T18:00:00.000Z"
        }

for q in questions_data:
    q_num = q["num"]
    existing = next((p for p in posts if p.get("questionNumber") == q_num), None)
    entry = {
        "id": q["id"],
        "questionNumber": q_num,
        "date": q["date"],
        "subject": q["subject"],
        "topic": q["topic"],
        "questionHi": q["questionHi"],
        "questionEn": q["questionEn"],
        "options": q["options"],
        "correctOption": q["correctOption"],
        "explanation": q["explanation"],
        "instagramImageUrl": f"/uploads/social-kits/rajasthan-culture/question-{q_num}/reel_9_16.jpg",
        "paperCropUrl": f"/uploads/social-kits/rajasthan-culture/question-{q_num}/paper_crop.jpg",
        "aiPrompt": q["aiPrompt"],
        "status": {
            "instagramUploaded": False,
            "twitterPosted": False
        }
    }
    if existing:
        existing.update(entry)
    else:
        posts.append(entry)

with open(history_path, "w", encoding="utf-8") as f:
    json.dump(posts, f, ensure_ascii=False, indent=2)

print("\n🎉 Q36-Q40 generated and synced to social_posts_history.json successfully!")
