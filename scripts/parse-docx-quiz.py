#!/usr/bin/env python3
"""
Generalized .docx Quiz Parser for Rajasthan Exam Twister
Extracts questions, 4 options, green highlight answers (#22c55e), exam source tags, and explanations.
Outputs clean seed JSON to question-bank/seeds/<subject>-<topic-slug>.json.
"""

import os
import sys
import zipfile
import re
import json
from collections import Counter
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-") or "quiz-topic"

def parse_docx(docx_path):
    if not os.path.exists(docx_path):
        print(f"Error: File not found: {docx_path}")
        sys.exit(1)

    print(f"\n=======================================================")
    print(f"Processing .docx Quiz File: {os.path.basename(docx_path)}")
    print(f"Full Path: {docx_path}")
    print(f"File Size: {os.path.getsize(docx_path)} bytes")
    print(f"=======================================================\n")

    with zipfile.ZipFile(docx_path, 'r') as docx:
        xml_content = docx.read('word/document.xml')

    root = ET.fromstring(xml_content)

    raw_p_list = []
    for p in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
        raw_text = "".join(t.text for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text).strip()
        if not raw_text:
            continue
        
        has_green = False
        has_red = False
        
        for r in p.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
            r_shd = r.find('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}shd')
            if r_shd is not None:
                fill = (r_shd.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fill') or "").lower()
                if fill in ['22c55e', 'f0fdf4', '15803d', '16a34a']:
                    has_green = True
                elif fill in ['ef4444', 'fef2f2', 'b91c1c', 'dc2626']:
                    has_red = True
                    
        raw_p_list.append({
            'text': raw_text,
            'has_green': has_green,
            'has_red': has_red
        })

    # Infer topic title from filename or header
    base_name = os.path.splitext(os.path.basename(docx_path))[0]
    topic_title = base_name.strip()

    questions = []
    current_quiz_header = topic_title

    i = 0
    while i < len(raw_p_list):
        item = raw_p_list[i]
        text = item['text']
        
        # Check for Quiz title header e.g. "मरुस्थलीकरण Quiz 1"
        if ("Quiz" in text or "Part" in text or "Test" in text or topic_title in text) and not text.startswith("प्रश्न") and not text.startswith("परिणाम"):
            current_quiz_header = text
            i += 1
            continue
                
        # Check question start e.g. "प्रश्न 1", "प्रश्न 2सही उत्तर", "प्रश्न 3गलत उत्तर"
        q_match = re.match(r"^प्रश्न\s*(\d+)", text)
        if q_match:
            q_num = int(q_match.group(1))
            i += 1
            q_lines = []
            exam_source = ""
            
            while i < len(raw_p_list):
                next_text = raw_p_list[i]['text']
                if next_text in ['A', 'B', 'C', 'D'] or re.match(r"^प्रश्न\s*\d+", next_text):
                    break
                # Skip score banners like "परिणाम73%07:34"
                if not next_text.startswith("परिणाम"):
                    # Detect exam source lines
                    if re.search(r"\b(Exam|Paper|RPSC|RSMSSB|CET|Patwar|Police|VDO|Lab Assistant|Teacher|LDC|GrII|GrI|REET|SI)\b", next_text, re.I):
                        exam_source = next_text
                    else:
                        q_lines.append(next_text)
                i += 1
                
            full_q_text = "\n".join(q_lines).strip()
            
            options = []
            correct_idx = -1
            student_idx = -1
            explanation = ""
            
            # Collect options A, B, C, D
            for target_letter in ['A', 'B', 'C', 'D']:
                if i < len(raw_p_list) and raw_p_list[i]['text'] == target_letter:
                    is_letter_green = raw_p_list[i]['has_green']
                    is_letter_red = raw_p_list[i]['has_red']
                    i += 1
                    
                    opt_content_lines = []
                    is_content_green = False
                    is_content_red = False
                    
                    while i < len(raw_p_list):
                        sub = raw_p_list[i]
                        sub_text = sub['text']
                        if sub_text in ['A', 'B', 'C', 'D'] or re.match(r"^प्रश्न\s*\d+", sub_text) or "💡" in sub_text or sub_text == "व्याख्या":
                            break
                        opt_content_lines.append(sub_text)
                        if sub['has_green']: is_content_green = True
                        if sub['has_red']: is_content_red = True
                        i += 1
                        
                    opt_val = " ".join(opt_content_lines).strip()
                    opt_idx = ord(target_letter) - ord('A')
                    
                    if is_letter_green or is_content_green:
                        correct_idx = opt_idx
                    if is_letter_red or is_content_red:
                        student_idx = opt_idx
                        
                    options.append(opt_val)
                    
            # Check for explanation following Option D
            exp_lines = []
            while i < len(raw_p_list):
                next_p = raw_p_list[i]['text']
                if re.match(r"^प्रश्न\s*\d+", next_p) or (("Quiz" in next_p or "Test" in next_p) and not next_p.startswith("परिणाम")):
                    break
                if next_p.startswith("💡") or next_p == "व्याख्या":
                    cleaned = re.sub(r"^💡\s*व्याख्या\s*[:-]?", "", next_p).strip()
                    if cleaned:
                        exp_lines.append(cleaned)
                elif not next_p.startswith("परिणाम"):
                    exp_lines.append(next_p)
                i += 1
                
            if exp_lines:
                explanation = "\n".join(exp_lines).strip()
                
            questions.append({
                'qNum': q_num,
                'questionText': full_q_text,
                'examSource': exam_source if exam_source else None,
                'options': options,
                'correctOptionIndex': correct_idx,
                'studentWrongOptionIndex': student_idx if student_idx != -1 else None,
                'explanation': explanation,
                'quizHeader': current_quiz_header
            })
        else:
            i += 1

    print(f"Total extracted questions: {len(questions)}")

    # Audit questions
    valid_count = 0
    missing_answers = []
    invalid_options = []

    for idx, q in enumerate(questions):
        if len(q['options']) != 4:
            invalid_options.append((idx + 1, len(q['options']), q['questionText']))
        if q['correctOptionIndex'] < 0 or q['correctOptionIndex'] > 3:
            missing_answers.append((idx + 1, q['correctOptionIndex'], q['questionText']))
        if len(q['options']) == 4 and 0 <= q['correctOptionIndex'] <= 3:
            valid_count += 1

    print(f"\n--- VALIDATION AUDIT ---")
    print(f"Successfully Extracted & Validated: {valid_count} / {len(questions)}")
    print(f"Questions with invalid option count (!= 4): {len(invalid_options)}")
    if invalid_options:
        for io in invalid_options[:5]:
            print(f"  ❌ Q#{io[0]}: has {io[1]} options: {io[2][:60]}...")
            
    print(f"Questions with missing/invalid correct answer: {len(missing_answers)}")
    if missing_answers:
        for ma in missing_answers[:5]:
            print(f"  ❌ Q#{ma[0]}: ans_idx={ma[1]}: {ma[2][:60]}...")

    dist = {0: 0, 1: 0, 2: 0, 3: 0, -1: 0}
    for q in questions:
        dist[q['correctOptionIndex']] = dist.get(q['correctOptionIndex'], 0) + 1
    print(f"Answer distribution (0=A, 1=B, 2=C, 3=D): A: {dist[0]}, B: {dist[1]}, C: {dist[2]}, D: {dist[3]}, Missing: {dist[-1]}")

    headers_count = Counter(q['quizHeader'] for q in questions)
    print("\n--- BATCH BREAKDOWN ---")
    for h, count in headers_count.items():
        print(f"  • {h}: {count} questions")

    questions_with_exp = sum(1 for q in questions if q['explanation'])
    print(f"Questions with rich explanations: {questions_with_exp} / {len(questions)}")

    # Subject & category inference
    parent_dir = os.path.basename(os.path.dirname(docx_path))
    subject = "राजस्थान सामान्य ज्ञान"
    category_slug = "rajasthan-gk"

    if "geography" in parent_dir or "भूगोल" in topic_title or "मरुस्थल" in topic_title:
        subject = "राजस्थान का भूगोल"
        category_slug = "rajasthan-geography"
    elif "history" in parent_dir or "इतिहास" in topic_title:
        subject = "राजस्थान का इतिहास"
        category_slug = "rajasthan-history"
    elif "art" in parent_dir or "culture" in parent_dir or "संस्कृति" in topic_title or "देवता" in topic_title or "चित्र" in topic_title:
        subject = "राजस्थान कला एवं संस्कृति"
        category_slug = "rajasthan-art-culture"
    elif "hindi" in parent_dir or "हिन्दी" in topic_title:
        subject = "सामान्य हिन्दी"
        category_slug = "hindi"

    topic_slug = slugify(topic_title)
    if "मरुस्थल" in topic_title:
        topic_slug = "marusthalikaran"
    elif "1857" in topic_title:
        topic_slug = "1857-ki-kranti"
    elif "चित्र" in topic_title:
        topic_slug = "chitra-shailiyan"

    seed_data = {
        "topic": {
            "title": topic_title,
            "slug": topic_slug,
            "subject": subject,
            "categorySlug": category_slug
        },
        "batches": []
    }

    for header, count in headers_count.items():
        batch_qs = [
            {
                "order": idx + 1,
                "questionText": q["questionText"],
                "examSource": q.get("examSource"),
                "options": q["options"],
                "correctOptionIndex": q["correctOptionIndex"],
                "explanation": q["explanation"]
            }
            for idx, q in enumerate(q for q in questions if q["quizHeader"] == header)
        ]
        seed_data["batches"].append({
            "batchName": header,
            "questions": batch_qs
        })

    out_dir = os.path.join(os.getcwd(), "question-bank", "seeds")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, f"{category_slug}-{topic_slug}.json")

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(seed_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ SUCCESS: Consolidated seed JSON saved to:")
    print(f"   {out_file}")
    print(f"   File size: {os.path.getsize(out_file)} bytes\n")
    return out_file

if __name__ == "__main__":
    if len(sys.argv) > 1:
        docx_file = sys.argv[1]
    else:
        docx_file = r"c:\Users\Chirag Bhoi\Desktop\maytoaug\trynew\question-bank\newQuestions\rajasthan-geography\मरुस्थलीकरण.docx"
    parse_docx(docx_file)
