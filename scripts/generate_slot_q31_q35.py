import os
import json
import subprocess
from datetime import datetime

questions_data = [
    {
        "num": 31,
        "id": "raj-culture-q31",
        "date": "22 Oct 2026",
        "subject": "RAJASTHAN ART & CULTURE | कला एवं संस्कृति",
        "topic": "राजस्थान के लोक संत (संत जाम्भोजी व विश्नोई संप्रदाय)",
        "questionHi": "विश्नोई संप्रदाय के प्रवर्तक संत जाम्भोजी ने 1485 ई. में किस स्थान पर 29 नियमों की आचार संहिता देकर विश्नोई पंथ का प्रवर्तन किया था?",
        "questionEn": "(At which sacred site in 1485 AD did Saint Jambhoji establish the Bishnoi sect by initiating the code of 29 tenets?)",
        "options": [
            {"key": "A", "text": "मुकाम (तालवा, नोखा)", "isCorrect": False},
            {"key": "B", "text": "समराथल धोरा (बीकानेर)", "isCorrect": True},
            {"key": "C", "text": "लालासर (बीकानेर)", "isCorrect": False},
            {"key": "D", "text": "पीपासर (नागौर)", "isCorrect": False}
        ],
        "correctOption": "B",
        "explanation": "संत जाम्भोजी का जन्म 1451 ई. में भाद्रपद कृष्ण अष्टमी (जन्माष्टमी) को पीपासर (नागौर) में पंवार वंशीय राजपूत परिवार में हुआ। 1485 ई. (कार्तिक बदी अष्टमी) में इन्होंने समराथल धोरा (बीकानेर) पर 29 नियमों का उपदेश देकर विश्नोई संप्रदाय की स्थापना की। इनकी समाधि मुकाम (तालवा, नोखा तहसील, बीकानेर) में है जहाँ प्रतिवर्ष फाल्गुन व आश्विन अमावस्या को विशाल मेला लगता है।",
        "aiPrompt": "Vertical 9:16 serene spiritual desert scene in Western Rajasthan, sacred high sand dune of Samrathal Dhora under a majestic golden sunset, herd of graceful blackbucks and chinkaras resting peacefully near Khejri trees, sacred holy fire (havan kund) with gentle fragrant smoke, ultra-realistic 8k cinematic Rajasthan cultural heritage, no text."
    },
    {
        "num": 32,
        "id": "raj-culture-q32",
        "date": "22 Oct 2026",
        "subject": "RAJASTHAN ART & CULTURE | कला एवं संस्कृति",
        "topic": "राजस्थान के लोक संत (जसनाथी संप्रदाय एवं अग्नि नृत्य)",
        "questionHi": "राजस्थान का सुप्रसिद्ध 'अग्नि नृत्य' (Fire Dance) 'फतेह-फतेह' के रणघोष के साथ धधकते अंगारों पर किस संप्रदाय के सिद्ध पुरुषों द्वारा किया जाता है?",
        "questionEn": "(By the initiated Siddha saints of which sect is Rajasthan's famous 'Agni Nritya' (Fire Dance) performed over blazing red embers chanting 'Fateh-Fateh'?)",
        "options": [
            {"key": "A", "text": "विश्नोई संप्रदाय (Bishnoi)", "isCorrect": False},
            {"key": "B", "text": "जसनाथी संप्रदाय (Jasnathi)", "isCorrect": True},
            {"key": "C", "text": "दादू पंथ (Dadu Panth)", "isCorrect": False},
            {"key": "D", "text": "निरंजनी संप्रदाय (Niranjani)", "isCorrect": False}
        ],
        "correctOption": "B",
        "explanation": "अग्नि नृत्य जसनाथी संप्रदाय के सिद्ध पुरुषों द्वारा कतरियासर (बीकानेर) में फाल्गुन व माघ मास के मेलों पर रात्रि जागरण में किया जाता है। नर्तक धधकते अंगारों के ढेर (धूंणा) के चारों ओर परिक्रमा कर अपने गुरु को प्रणाम करते हुए 'फतेह-फतेह' घोष के साथ अंगारों पर नृत्य करते हैं। जसनाथी संप्रदाय में 36 नियम होते हैं तथा जाल वृक्ष व मोरपंख को अत्यंत पवित्र माना जाता है।",
        "aiPrompt": "Vertical 9:16 dramatic cultural night photography in Bikaner desert. Traditional ascetic folk performers performing the awe-inspiring sacred fire dance barefoot over glowing golden-red charcoal embers (Dhoona), dramatic orange fire sparks flying in the night sky, mystical trance atmosphere, cinematic lighting, 8k photorealistic heritage, no text."
    },
    {
        "num": 33,
        "id": "raj-culture-q33",
        "date": "22 Oct 2026",
        "subject": "RAJASTHAN ART & CULTURE | कला एवं संस्कृति",
        "topic": "राजस्थान के लोक संत (संत दादू दयाल - राजस्थान के कबीर)",
        "questionHi": "'राजस्थान के कबीर' कहलाने वाले संत दादू दयाल जी ने 1585 ई. में फतेहपुर सीकरी में मुगल सम्राट अकबर से किस शासक के सहयोग से ऐतिहासिक भेंट की थी?",
        "questionEn": "(With the assistance of which Amer ruler did Saint Dadu Dayal ('Kabir of Rajasthan') meet Mughal Emperor Akbar at Fatehpur Sikri in 1585 AD?)",
        "options": [
            {"key": "A", "text": "राजा भगवंत दास (Bhagwant Das)", "isCorrect": True},
            {"key": "B", "text": "मिर्जा राजा मानसिंह (Man Singh I)", "isCorrect": False},
            {"key": "C", "text": "सवाई जयसिंह (Sawai Jai Singh)", "isCorrect": False},
            {"key": "D", "text": "राव कल्याणमल (Kalyanmal)", "isCorrect": False}
        ],
        "correctOption": "A",
        "explanation": "संत दादू दयाल (1544-1603 ई.) को 'राजस्थान का कबीर' कहा जाता है। 1585 ई. में आमेर के शासक राजा भगवंत दास के सहयोग से दादू जी की फतेहपुर सीकरी के इबादतखाने में मुगल सम्राट अकबर से 40 दिनों तक आध्यात्मिक चर्चा हुई थी। दादू पंथ की मुख्य पीठ नरेना/नारायणा (जयपुर ग्रामीण) में है। दादू जी के सत्संग स्थल को 'अलख दरीबा' कहा जाता है। इनके 52 प्रमुख शिष्य '52 स्तंभ' कहलाते हैं।",
        "aiPrompt": "Vertical 9:16 grand historical heritage painting scene of 16th century Mughal-Rajput era. The wise Saint Dadu Dayal dressed in pure white ascetic robes engaged in deep philosophical discourse with Mughal Emperor Akbar inside an intricately carved imperial sandstone pavilion at Fatehpur Sikri, warm sunlight rays, royal Persian carpets, 8k cinematic realism, no text."
    },
    {
        "num": 34,
        "id": "raj-culture-q34",
        "date": "22 Oct 2026",
        "subject": "RAJASTHAN ART & CULTURE | कला एवं संस्कृति",
        "topic": "राजस्थान की चित्रकला (किशनगढ़ शैली व बणी-ठणी)",
        "questionHi": "राजस्थान की किस चित्रशैली के विश्वविख्यात चित्र 'बणी-ठणी' को प्रख्यात कलाविद् एरिक डिक्सन ने 'भारत की मोनालिसा' (Mona Lisa of India) की संज्ञा दी थी?",
        "questionEn": "(The masterwork painting 'Bani Thani' of which Rajasthani school of painting was famously celebrated as the 'Mona Lisa of India' by art critic Eric Dickinson?)",
        "options": [
            {"key": "A", "text": "मेवाड़ चित्रशैली (Mewar)", "isCorrect": False},
            {"key": "B", "text": "किशनगढ़ चित्रशैली (Kishangarh)", "isCorrect": True},
            {"key": "C", "text": "बूंदी चित्रशैली (Bundi)", "isCorrect": False},
            {"key": "D", "text": "नाथद्वारा चित्रशैली (Nathdwara)", "isCorrect": False}
        ],
        "correctOption": "B",
        "explanation": "किशनगढ़ शैली का स्वर्णकाल महाराजा सावंत सिंह (नागरीदास) के शासनकाल (1748-1764 ई.) को माना जाता है। इस शैली का सर्वाधिक प्रसिद्ध चित्र 'बणी-ठणी' है, जिसे सावंत सिंह के दरबारी चित्रकार मोरध्वज निहालचंद ने चित्रित किया था। एरिक डिक्सन ने इसे 'भारत की मोनालिसा' कहा। इस चित्र की प्रमुख विशेषताएँ: धनुषाकार भौहें, कमल की पंखुड़ी जैसी आँखें तथा नाक में 'बेसरी' आभूषण। 5 मई 1973 को भारत सरकार ने इस पर 20 पैसे का डाक टिकट जारी किया था।",
        "aiPrompt": "Vertical 9:16 elegant royal Kishangarh miniature aesthetic. Royal Rajput princess dressed in sheer golden-bordered odhani, wearing traditional pearl Besari nose ring, poised gracefully near Gundolav lake under a moonlit starlit sky, delicate lotus flowers in bloom, marble jharokha, rich midnight blue and gold palette, 8k ultra-detailed museum masterpiece, no text."
    },
    {
        "num": 35,
        "id": "raj-culture-q35",
        "date": "22 Oct 2026",
        "subject": "RAJASTHAN ART & CULTURE | कला एवं संस्कृति",
        "topic": "राजस्थान के ऐतिहासिक दुर्ग (मेहरानगढ़ दुर्ग, जोधपुर)",
        "questionHi": "जोधपुर के मेहरानगढ़ दुर्ग की भव्यता देखकर किस प्रसिद्ध ब्रिटिश लेखक/इतिहासकार ने कहा था कि 'इसका निर्माण शायद परियों और फरिश्तों ने किया है'?",
        "questionEn": "(Which renowned British author exclaimed upon gazing at Jodhpur's Mehrangarh Fort that 'it must have been built by angels, fairies and giants'?)",
        "options": [
            {"key": "A", "text": "कर्नल जेम्स टॉड (Col. James Tod)", "isCorrect": False},
            {"key": "B", "text": "रूडयार्ड किपलिंग (Rudyard Kipling)", "isCorrect": True},
            {"key": "C", "text": "फर्ग्यूसन (James Fergusson)", "isCorrect": False},
            {"key": "D", "text": "बिशप हेबर (Bishop Heber)", "isCorrect": False}
        ],
        "correctOption": "B",
        "explanation": "मेहरानगढ़ दुर्ग (जोधपुर) का निर्माण 1459 ई. में राव जोधा द्वारा चिड़ियाटूक पहाड़ी पर करवाया गया था। इसे मयूरध्वजगढ़, मोरध्वजगढ़ व गढ़ चिन्तामणि भी कहा जाता है। इसकी नींव में राजिया बाम्भी (राजाराम मेघवाल) को जीवित दफनाया गया था। विश्वप्रसिद्ध लेखक रूडयार्ड किपलिंग ने इस किले को देखकर लिखा था कि 'यह दुर्ग परियों और देवताओं (फरिश्तों) द्वारा बनाया गया प्रतीत होता है', जबकि बूंदी के तारागढ़ दुर्ग के लिए उन्होंने 'भूत-प्रेतों द्वारा निर्मित' कहा था।",
        "aiPrompt": "Vertical 9:16 breathtaking low-angle dramatic view of Mehrangarh Fort towering on the sheer cliff of Chidiyatook hill in the Golden Blue City Jodhpur. Majestic red sandstone ramparts illuminated by golden evening sun, flying pigeons, indigo blue painted houses below, epic cinematic scale, 8k photorealistic architectural perfection, no text."
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

print("Q31-Q35 generated and synced to social_posts_history.json successfully!")
