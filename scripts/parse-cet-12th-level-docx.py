#!/usr/bin/env python3
"""
RSMSSB CET 2022 (12th Level / Senior Secondary) - 04 Feb 2023 Shift 1 Parser
Parses the 150 questions from 'CET Prev Paper.docx' into our official seed JSON format.
Follows pdf-quiz-batch workflow guidelines:
- Extracts question statement, 4 clean options (skips 5th option 'अनुत्तरित प्रश्न').
- Detects green highlight (#27ae61 with white font) for correctOptionIndex (0..3).
- Accurately captures deleted questions (e.g. Q.93) with board explanation.
- Saves local seed JSON to question-bank/seeds/rsmssb-cet-12th-level-2023-04-feb-shift-1.json.
- ZERO database writes (DB seeding only on explicit user confirmation).
"""

import zipfile
import xml.etree.ElementTree as ET
import sys
import os
import re
import json
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

DOCX_PATH = r"c:\Users\Chirag Bhoi\Desktop\maytoaug\trynew\question-bank\newQuestions\rajasthan history\CET Prev Paper.docx"
OUT_PATH = r"c:\Users\Chirag Bhoi\Desktop\maytoaug\trynew\question-bank\seeds\rsmssb-cet-12th-level-2023-04-feb-shift-1.json"

def parse_cet_paper():
    print("=" * 60)
    print("Extracting RSMSSB CET 2022 (12th Level) 04 Feb 2023 Shift-1 Paper")
    print(f"Source Docx: {DOCX_PATH}")
    print("=" * 60)

    if not os.path.exists(DOCX_PATH):
        print(f"Error: Docx file not found: {DOCX_PATH}")
        sys.exit(1)

    with zipfile.ZipFile(DOCX_PATH, 'r') as z:
        xml_content = z.read("word/document.xml")
        root = ET.fromstring(xml_content)

    paras = list(root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'))

    parsed_paras = []
    for idx, p in enumerate(paras):
        txt = ''.join(t.text for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text).strip()
        if not txt:
            continue
        
        p_shd = None
        pPr = p.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr')
        if pPr is not None:
            s = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}shd')
            if s is not None:
                p_shd = s.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fill')
                
        r_cols = []
        for r in p.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
            rPr = r.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rPr')
            if rPr is not None:
                c = rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}color')
                if c is not None:
                    r_cols.append(c.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val'))

        parsed_paras.append({
            'idx': idx,
            'text': txt,
            'p_shd': p_shd,
            'r_cols': r_cols
        })

    questions = []
    i = 0
    while i < len(parsed_paras):
        item = parsed_paras[i]
        m = re.match(r"^Q\.\s*(\d+)\s*(.*)", item['text'], re.DOTALL)
        if m:
            q_num = int(m.group(1))
            q_text = m.group(2).strip()
            
            # Embed diagram images for Q24 and Q46 using Cloudinary CDN
            if q_num == 24:
                q_text = f"{q_text}\n![आकृति शृंखला](https://res.cloudinary.com/dplnd4t4j/image/upload/v1793096994/rajasthan_exam_twister/quizzes/cet-2022-12th-shift1/q24_figure_series.jpg)"
            elif q_num == 46:
                # Format pie chart prompt and question
                q_text = "निम्न पाई आलेख का अध्ययन कर निम्न प्रश्न का उत्तर दें –\n![खर्च चार्ट (पाई आलेख)](https://res.cloudinary.com/dplnd4t4j/image/upload/v1793096996/rajasthan_exam_twister/quizzes/cet-2022-12th-shift1/q46_pie_chart.jpg)\nबाइन्डिंग की अपेक्षा विज्ञापन पर कितना प्रतिशत ज्यादा खर्च किया है ?"
            
            i += 1
            
            opt_candidates = []
            explanation_lines = []
            passed_unattempted = False
            
            while i < len(parsed_paras):
                curr = parsed_paras[i]
                if re.match(r"^Q\.\s*\d+\b", curr['text']):
                    break
                    
                if curr['text'] == "अनुत्तरित प्रश्न":
                    passed_unattempted = True
                    i += 1
                    continue
                    
                if curr['text'].startswith("Status:"):
                    i += 1
                    continue
                    
                if not passed_unattempted:
                    opt_candidates.append(curr)
                else:
                    explanation_lines.append(curr['text'])
                i += 1
                
            options = []
            correct_idx = -1
            
            for opt_i, opt in enumerate(opt_candidates):
                is_green = (opt['p_shd'] == '27ae61' and 'ffffff' in opt['r_cols'])
                if is_green:
                    correct_idx = opt_i
                options.append(opt['text'])
                
            explanation = "\n".join(explanation_lines).strip()
            
            # Special handling for deleted question Q.93 in official key
            if q_num == 93 and correct_idx == -1:
                correct_idx = 0
                if "हटा दिया गया" not in explanation:
                    explanation = "⚠️ [RSMSSB FINAL KEY: DELETED QUESTION / हटाया गया प्रश्न] - अंतिम उत्तर कुंजी में यह प्रश्न बोर्ड द्वारा हटा दिया गया था क्योंकि एमएस पॉवरपॉइंट में 'स्लाइड शो व्यू', 'आउटलाइन व्यू', 'नोर्मल व्यू' और 'स्लाइड सोर्टर व्यू' चारों ही मान्य व्यू विकल्प होते हैं।"
                else:
                    explanation = f"⚠️ [RSMSSB FINAL KEY: DELETED QUESTION / हटाया गया प्रश्न] - {explanation} (एमएस पॉवरपॉइंट में 'स्लाइड शो', 'आउटलाइन', 'नोर्मल' और 'स्लाइड सोर्टर' चारों ही मान्य व्यू विकल्प होते हैं।)"
                    
            if not explanation:
                option_letter = chr(65 + correct_idx) if 0 <= correct_idx <= 3 else "N/A"
                explanation = f"RSMSSB CET 2022 (12th Level) 04 Feb 2023 Shift-1 Official Master Answer: Option ({option_letter})."

            questions.append({
                'order': q_num,
                'questionText': q_text,
                'options': options,
                'correctOptionIndex': correct_idx,
                'explanation': explanation,
                'examSource': "RSMSSB CET (12th Level) 04 Feb 2023 Shift-1"
            })
        else:
            i += 1

    print(f"\nExtracted Questions: {len(questions)}")

    # Validation Audit
    valid_count = 0
    invalid_options = []
    missing_answers = []

    for q in questions:
        if len(q['options']) != 4:
            invalid_options.append((q['order'], len(q['options']), q['questionText']))
        if q['correctOptionIndex'] < 0 or q['correctOptionIndex'] > 3:
            missing_answers.append((q['order'], q['correctOptionIndex'], q['questionText']))
        if len(q['options']) == 4 and 0 <= q['correctOptionIndex'] <= 3:
            valid_count += 1

    print("\n--- VALIDATION AUDIT REPORT ---")
    print(f"Total Questions: {len(questions)} / 150")
    print(f"Validated & Clean: {valid_count} / {len(questions)}")
    print(f"Questions with invalid options count (!= 4): {len(invalid_options)}")
    print(f"Questions with missing/invalid correctOptionIndex: {len(missing_answers)}")

    dist = Counter(q['correctOptionIndex'] for q in questions)
    print(f"Answer Key Distribution: A: {dist[0]}, B: {dist[1]}, C: {dist[2]}, D: {dist[3]}")

    # Build full seed JSON payload
    seed_payload = {
        "title": "RSMSSB CET 2022 (12th Level) 04 February 2023 Shift-1 Official Master Paper",
        "subject": "राजस्थान CET (12th Level) ऑफिशियल प्रीवियस ईयर पेपर",
        "slug": "rsmssb-cet-12th-level-04-feb-2023-shift-1",
        "categorySlug": "previous-year-papers",
        "examTags": [
            "RSMSSB CET 2022",
            "CET 12th Level",
            "CET 04 Feb 2023 Shift-1",
            "RSMSSB",
            "PYQ",
            "Senior Secondary CET"
        ],
        "difficulty": "medium",
        "status": "PUBLISHED",
        "timeLimitSeconds": 10800,
        "defaultMarks": 2,
        "defaultNegativeMarks": 0,
        "totalQuestions": len(questions),
        "topic": {
            "title": "RSMSSB CET 2022 (12th Level) 04 February 2023 Shift-1",
            "slug": "rsmssb-cet-12th-level-04-feb-2023-shift-1",
            "subject": "राजस्थान CET प्रीवियस ईयर पेपर्स",
            "categorySlug": "previous-year-papers"
        },
        "batches": [
            {
                "batchName": "RSMSSB CET (12th Level) 04 Feb 2023 Shift-1 (Complete 150 Questions)",
                "questions": questions
            }
        ],
        "questions": questions
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(seed_payload, f, ensure_ascii=False, indent=2)

    print(f"\n✅ SUCCESS: Official Seed JSON written to:")
    print(f"   {OUT_PATH}")
    print(f"   File Size: {os.path.getsize(OUT_PATH)} bytes")
    print("=" * 60)

if __name__ == "__main__":
    parse_cet_paper()
