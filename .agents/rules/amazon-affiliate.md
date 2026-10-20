# Amazon Affiliate Integration Rules & Guidelines

**Tracking Tag:** `theshoppi0d89-21`  
**Configuration File:** `config/affiliate-books.json`

---

## 1. When Generating Blogs or Notes:
जब भी AI कोई नया ब्लॉग पोस्ट (`blog-automation-engine`) या नए परीक्षा नोट्स तैयार करे:
1. `config/affiliate-books.json` से आर्टिकल के विषय (Topic) के अनुसार सबसे प्रासंगिक **1 पुस्तक** चुनें:
   - **इतिहास / कला संस्कृति / लोक देवता / त्यौहार:** `rajasthan_history_culture`
   - **भूगोल / भौतिक विशेषताएं / सीमा / जल प्रबंधन:** `rajasthan_geography`
   - **करेंट अफेयर्स / सरकारी योजनाएं / समसामयिकी:** `rajasthan_current_affairs`
   - **सामान्य / मिश्रित / टेस्ट सीरीज़ / पिछले वर्ष के प्रश्न:** `rajasthan_pariksha_20`
2. आर्टिकल के अंत (Footer / Conclusion के ठीक पहले) निम्नलिखित कार्ड एम्बेड करें:

```html
<div class="affiliate-book-card bg-amber-50 border border-amber-200 rounded-2xl p-5 my-8 shadow-xs">
  <div class="flex items-start gap-4">
    <span class="text-3xl" aria-hidden="true">📚</span>
    <div class="flex-1">
      <h4 class="font-bold text-slate-900 text-base">राजस्थान GK की सर्वश्रेष्ठ तैयारी हेतु अनुशंसित पुस्तक:</h4>
      <p class="text-sm text-slate-700 mt-1 font-medium">[किताब का नाम]</p>
      <p class="text-xs text-slate-500 mt-0.5">[किताब का संक्षिप्त विवरण]</p>
      <div class="mt-4">
        <a href="[Amazon Affiliate Link]" target="_blank" rel="sponsored nofollow noopener" 
           class="inline-flex items-center gap-2 bg-[#FF9900] hover:bg-[#e88b00] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs">
           <span>Amazon पर कीमत व छूट देखें</span>
           <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  </div>
</div>
```

---

## 2. SEO & Legal Compliance Rules (Critical):
1. **`rel="sponsored nofollow noopener"` अनिवार्य है:**
   - किसी भी Amazon एफिलिएट लिंक में `rel="sponsored nofollow"` छूटना नहीं चाहिए। यह Google AdSense व Webmaster दिशानिर्देशों के लिए आवश्यक है।
2. **प्रति आर्टिकल अधिकतम 1 या 2 बुक्स:**
   - अत्यधिक लिंक्स (Spammy affiliate) से बचें। प्रति आर्टिकल 1 प्रासंगिक कार्ड सर्वोत्तम छात्र अनुभव देता है।
3. **अनिवार्य डिस्क्लोज़र:**
   - साइट-वाइड फुटर और डिस्क्लेमर पेज पर Amazon Associates Program का उल्लेख हमेशा बना रहना चाहिए।
