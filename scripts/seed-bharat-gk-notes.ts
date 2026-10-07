import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { Note } from "../server/models/Note";
import { Category } from "../server/models/Category";
import { sanitizeContentHtml } from "../server/lib/sanitize";

// Utility to convert Markdown headers and lists to clean semantic HTML
function convertBharatParichayToHtml(): string {
  return `
<h2>1. भारत का नामकरण एवं ऐतिहासिक पृष्ठभूमि</h2>
<p>भारत का प्राचीन नाम उत्तर भारत में बसने वाले आर्यों के नाम पर <strong>आर्यावर्त</strong> किया गया। इन आर्यों के शक्तिशाली चक्रवर्ती राजा भरत के नाम पर यह देश <strong>भारत</strong> कहलाया।</p>
<p>वैदिक आर्यों का प्रारंभिक निवास स्थान सिंधु घाटी में था। ईरानी (फारसी) सिन्धु नदी को <em>'हिन्दु नदी'</em> तथा इस भूभाग को <strong>हिन्दुस्तान</strong> कहते थे। यूनानियों ने सिन्धु को <em>'इण्डस (Indus)'</em> तथा इस देश को <strong>इंडिया (India)</strong> नाम दिया।</p>

<blockquote>
  <strong>भारतीय उपमहाद्वीप (Indian Subcontinent):</strong><br/>
  उत्तर में विशाल हिमालय पर्वत, दक्षिण-पश्चिम में हिन्दूकुश व सुलेमान श्रेणियाँ, उत्तर-पूर्व में पूर्वांचल पहाड़ियाँ तथा दक्षिण में हिन्द महासागर से घिरी यह एक प्राकृतिक भौगोलिक इकाई है। इसमें <strong>भारत, पाकिस्तान, नेपाल, भूटान एवं बांग्लादेश</strong> शामिल हैं।
</blockquote>

<h2>2. स्थिति एवं अक्षांशीय/देशान्तरीय विस्तार</h2>
<p>अक्षांशीय दृष्टि से भारत <strong>उत्तरी गोलार्द्ध</strong> में तथा देशान्तरीय दृष्टि से <strong>पूर्वी गोलार्द्ध</strong> में स्थित है। भारत दक्षिणी एशिया के मध्य में स्थित है। कर्क रेखा देश के मध्य से गुजरती है, अतः भारत का दक्षिणी भाग <strong>उष्ण कटिबंध</strong> तथा उत्तरी भाग <strong>उपोष्ण/शीतोष्ण कटिबंध</strong> में आता है।</p>

<table>
  <thead>
    <tr>
      <th>पैरामीटर</th>
      <th>विस्तार / मान</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>अक्षांशीय विस्तार (संपूर्ण)</strong></td>
      <td>6°4' उत्तरी अक्षांश (इन्दिरा प्वाइंट) से 37°6' उत्तरी अक्षांश (इन्दिरा कॉल)</td>
    </tr>
    <tr>
      <td><strong>अक्षांशीय विस्तार (मुख्य भूमि)</strong></td>
      <td>8°4' उत्तरी अक्षांश (कन्याकुमारी) से 37°6' उत्तरी अक्षांश</td>
    </tr>
    <tr>
      <td><strong>देशान्तरीय विस्तार</strong></td>
      <td>68°7' पूर्वी देशान्तर (गोरमोता) से 97°25' पूर्वी देशान्तर (किबिथु)</td>
    </tr>
    <tr>
      <td><strong>कुल क्षेत्रफल</strong></td>
      <td><strong>32,87,263 वर्ग किमी.</strong> (विश्व के कुल भौगोलिक क्षेत्रफल का 2.43%)</td>
    </tr>
    <tr>
      <td><strong>विश्व में क्षेत्रफल की दृष्टि से स्थान</strong></td>
      <td>7वाँ बड़ा देश (रूस, कनाडा, चीन, USA, ब्राजील, ऑस्ट्रेलिया के बाद)</td>
    </tr>
    <tr>
      <td><strong>उत्तर से दक्षिण लंबाई</strong></td>
      <td><strong>3,214 किमी.</strong> (कश्मीर से कन्याकुमारी)</td>
    </tr>
    <tr>
      <td><strong>पूर्व से पश्चिम चौड़ाई</strong></td>
      <td><strong>2,933 किमी.</strong> (अरुणाचल प्रदेश से कच्छ तक)</td>
    </tr>
    <tr>
      <td><strong>भौगोलिक आकृति</strong></td>
      <td>चतुष्कोणीय (Quadrangular)</td>
    </tr>
  </tbody>
</table>

<h2>3. भारतीय मानक समय (Indian Standard Time - IST)</h2>
<p>भारत की मानक समय रेखा <strong>82°30' (82.5°) पूर्वी देशान्तर</strong> है, जो उत्तर प्रदेश में प्रयागराज (इलाहाबाद) के निकट मिर्जापुर / नैनी से होकर गुजरती है।</p>
<ul>
  <li>भारतीय मानक समय (IST) ग्रीनविच माध्य समय (GMT/UTC) से <strong>5 घण्टे 30 मिनट आगे (+5:30)</strong> है।</li>
  <li><strong>82°30' पूर्वी देशान्तर रेखा भारत के 5 राज्यों से गुजरती है:</strong>
    <ol>
      <li>उत्तर प्रदेश</li>
      <li>मध्य प्रदेश</li>
      <li>छत्तीसगढ़</li>
      <li>ओडिशा</li>
      <li>आन्ध्र प्रदेश</li>
    </ol>
  </li>
</ul>

<h2>4. कर्क रेखा (Tropic of Cancer - 23°30' N)</h2>
<p>23°30' उत्तरी अक्षांश रेखा (कर्क रेखा) भारत के लगभग मध्य से होकर <strong>8 राज्यों</strong> से गुजरती है (पश्चिम से पूर्व क्रम):</p>
<ol>
  <li>गुजरात</li>
  <li>राजस्थान (बांसवाड़ा एवं डूंगरपुर)</li>
  <li>मध्य प्रदेश (सर्वाधिक लंबाई)</li>
  <li>छत्तीसगढ़</li>
  <li>झारखण्ड</li>
  <li>पश्चिम बंगाल</li>
  <li>त्रिपुरा</li>
  <li>मिजोरम</li>
</ol>

<blockquote>
  <strong>महत्वपूर्ण तथ्य:</strong> झारखण्ड की राजधानी <strong>राँची</strong> कर्क रेखा के सबसे नजदीक स्थित राजधानी शहर है। अन्य निकटवर्ती शहरों में गांधीनगर, भोपाल, अगरतला, आइजोल और बांसवाड़ा शामिल हैं।
</blockquote>

<h2>5. भारत के सुदूरस्थ अंतिम सीमा बिन्दु (Extreme Points)</h2>
<table>
  <thead>
    <tr>
      <th>दिशा</th>
      <th>अंतिम बिन्दु का नाम</th>
      <th>राज्य / केन्द्रशासित प्रदेश</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>उत्तरतम बिन्दु</strong></td>
      <td>इन्दिरा कॉल (Indira Col)</td>
      <td>लद्दाख</td>
    </tr>
    <tr>
      <td><strong>दक्षिणतम बिन्दु (संपूर्ण)</strong></td>
      <td>इन्दिरा प्वाइंट (पिगमेलियन / पार्सन्स प्वाइंट - 6°4' N)</td>
      <td>ग्रेट निकोबार द्वीप समूह</td>
    </tr>
    <tr>
      <td><strong>दक्षिणतम बिन्दु (मुख्य भूमि)</strong></td>
      <td>केप कोमोरिन (कन्याकुमारी - 8°4' N)</td>
      <td>तमिलनाडु</td>
    </tr>
    <tr>
      <td><strong>पूर्वोत्तर बिन्दु</strong></td>
      <td>किबिथु (Kibithu)</td>
      <td>अरुणाचल प्रदेश</td>
    </tr>
    <tr>
      <td><strong>पश्चिमतम बिन्दु</strong></td>
      <td>गुहार मोती / गोरमोता (कच्छ)</td>
      <td>गुजरात</td>
    </tr>
  </tbody>
</table>
<p><em>*नोट: इन्दिरा प्वाइंट भूमध्य रेखा (Equator) से 876 किमी. की दूरी पर स्थित है।</em></p>

<h2>6. भारत की अन्तर्राष्ट्रीय सीमा रेखाएं</h2>
<ul>
  <li><strong>रेडक्लिफ रेखा (Radcliffe Line):</strong> भारत एवं पाकिस्तान के मध्य (17 अगस्त 1947 को सर सिरिल रेडक्लिफ द्वारा निर्धारित)।</li>
  <li><strong>मैकमोहन रेखा (MacMahon Line):</strong> भारत (अरुणाचल प्रदेश) एवं चीन के मध्य (1914 में शिमला समझौते के तहत निर्धारित)।</li>
  <li><strong>डूरण्ड रेखा (Durand Line):</strong> भारत एवं अफगानिस्तान (वर्तमान में पाकिस्तान-अफगानिस्तान) के मध्य (1896 में सर मोर्टिमर डूरण्ड द्वारा निर्धारित)।</li>
  <li><strong>शून्य रेखा (Zero Line):</strong> त्रिपुरा एवं बांग्लादेश के मध्य की सीमा को शून्य रेखा कहा जाता है।</li>
  <li><strong>तीन बीघा गलियारा (Teen Bigha Corridor):</strong> भारत और बांग्लादेश को जोड़ने वाला गलियारा।</li>
  <li><strong>नियंत्रण रेखा (Line of Control - LoC):</strong> भारत और पाकिस्तान के बीच जम्मू-कश्मीर में 1972 के शिमला समझौते के तहत युद्धविराम रेखा।</li>
</ul>
  `.trim();
}

function convertBharatRajyaSthitiToHtml(): string {
  return `
<h2>1. भारत की प्रशासनिक संरचना (28 राज्य एवं 8 UTs)</h2>
<p>वर्तमान में भारत में <strong>28 राज्य</strong> तथा <strong>8 केन्द्रशासित प्रदेश (Union Territories)</strong> हैं।</p>

<table>
  <thead>
    <tr>
      <th>मानदंड</th>
      <th>शीर्ष / सबसे बड़ा</th>
      <th>न्यूनतम / सबसे छोटा</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>राज्य (क्षेत्रफल)</strong></td>
      <td>राजस्थान (3,42,239 वर्ग किमी.)</td>
      <td>गोवा (3,702 वर्ग किमी.)</td>
    </tr>
    <tr>
      <td><strong>राज्य (जनसंख्या 2011)</strong></td>
      <td>उत्तर प्रदेश (~19.98 करोड़)</td>
      <td>सिक्किम (~6.10 लाख)</td>
    </tr>
    <tr>
      <td><strong>केन्द्रशासित प्रदेश (क्षेत्रफल)</strong></td>
      <td>लद्दाख (क्षेत्रफल में सबसे बड़ा UT) / अण्डमान निकोबार</td>
      <td>लक्षद्वीप (32 वर्ग किमी.)</td>
    </tr>
    <tr>
      <td><strong>केन्द्रशासित प्रदेश (जनसंख्या)</strong></td>
      <td>दिल्ली (राष्ट्रीय राजधानी क्षेत्र)</td>
      <td>लक्षद्वीप (~64,473)</td>
    </tr>
    <tr>
      <td><strong>भारत का सबसे बड़ा जिला</strong></td>
      <td>कच्छ (गुजरात - 45,652 वर्ग किमी.)</td>
      <td>माहे (पुदुचेरी - 9 वर्ग किमी.)</td>
    </tr>
  </tbody>
</table>

<h2>2. भारत के 8 केन्द्रशासित प्रदेश एवं उनकी राजधानियाँ</h2>
<ol>
  <li><strong>लद्दाख:</strong> लेह (ग्रीष्मकालीन), कारगिल (शीतकालीन)</li>
  <li><strong>जम्मू और कश्मीर:</strong> श्रीनगर (ग्रीष्मकालीन), जम्मू (शीतकालीन)</li>
  <li><strong>दिल्ली (NCT):</strong> नई दिल्ली</li>
  <li><strong>चण्डीगढ़:</strong> चण्डीगढ़</li>
  <li><strong>दादरा एवं नगर हवेली तथा दमन एवं दीव:</strong> दमन</li>
  <li><strong>पुदुचेरी:</strong> पुदुचेरी (4 पृथक जिले: पुदुचेरी व कराइकल-तमिलनाडु, यनम-आंध्र प्रदेश, माहे-केरल)</li>
  <li><strong>लक्षद्वीप:</strong> कवरत्ती</li>
  <li><strong>अण्डमान और निकोबार द्वीप समूह:</strong> पोर्ट ब्लेयर</li>
</ol>

<h2>3. पड़ोसी देश एवं सीमावर्ती राज्य</h2>
<p>भारत की स्थलीय सीमा 7 देशों से लगती है (कुल स्थलीय सीमा: <strong>15,200 किमी.</strong>):</p>

<table>
  <thead>
    <tr>
      <th>देश</th>
      <th>सीमा लंबाई</th>
      <th>संबद्ध भारतीय राज्य / केन्द्रशासित प्रदेश</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>बांग्लादेश</strong></td>
      <td><strong>4,096.7 किमी.</strong> (सर्वाधिक)</td>
      <td>5 राज्य: पश्चिम बंगाल, मेघालय, मिजोरम, त्रिपुरा, असम</td>
    </tr>
    <tr>
      <td><strong>चीन</strong></td>
      <td>3,488 किमी. (3,917 किमी. कुल दावा)</td>
      <td>1 UT + 4 राज्य: लद्दाख (UT), हिमाचल प्रदेश, उत्तराखण्ड, सिक्किम, अरुणाचल प्रदेश</td>
    </tr>
    <tr>
      <td><strong>पाकिस्तान</strong></td>
      <td>3,323 किमी. (3,310 किमी.)</td>
      <td>2 UTs + 3 राज्य: लद्दाख, जम्मू-कश्मीर, पंजाब, राजस्थान, गुजरात</td>
    </tr>
    <tr>
      <td><strong>नेपाल</strong></td>
      <td>1,751 किमी.</td>
      <td>5 राज्य: उत्तराखण्ड, उत्तर प्रदेश, बिहार, पश्चिम बंगाल, सिक्किम</td>
    </tr>
    <tr>
      <td><strong>म्यांमार</strong></td>
      <td>1,643 किमी. (1,458 किमी.)</td>
      <td>4 राज्य: अरुणाचल प्रदेश, नागालैंड, मणिपुर, मिजोरम</td>
    </tr>
    <tr>
      <td><strong>भूटान</strong></td>
      <td>699 किमी. (587 किमी.)</td>
      <td>4 राज्य: सिक्किम, पश्चिम बंगाल, असम, अरुणाचल प्रदेश</td>
    </tr>
    <tr>
      <td><strong>अफगानिस्तान</strong></td>
      <td><strong>106 किमी.</strong> (न्यूनतम)</td>
      <td>1 UT: लद्दाख (पाक अधिकृत कश्मीर - PoK क्षेत्र)</td>
    </tr>
  </tbody>
</table>

<h2>4. पूर्वोत्तर की 'सात बहनें' (Seven Sisters) एवं विशेष सीमाएँ</h2>
<ul>
  <li><strong>सेवन सिस्टर्स (Seven Sisters):</strong> असम, अरुणाचल प्रदेश, नागालैंड, मणिपुर, मिजोरम, त्रिपुरा एवं मेघालय। <em>(नोट: सिक्किम 'सात बहनों' का भाग नहीं है, इसे ब्रदर स्टेट कहा जाता है)</em>।</li>
  <li><strong>केवल एक राज्य से सीमा बनाने वाले राज्य:</strong>
    <ul>
      <li><strong>सिक्किम:</strong> केवल पश्चिम बंगाल से सीमा बनाता है।</li>
      <li><strong>मेघालय:</strong> केवल असम से सीमा बनाता है।</li>
    </ul>
  </li>
  <li><strong>भू-आवेष्ठित राज्य (Landlocked States):</strong> वे राज्य जिनकी सीमा न तो समुद्र से मिलती है और न ही किसी विदेशी देश से।
    <br/>👉 <strong>5 राज्य:</strong> हरियाणा, मध्य प्रदेश, छत्तीसगढ़, झारखण्ड एवं तेलंगाना।
  </li>
</ul>

<h2>5. भारत की तटीय सीमा (Coastal Boundary Update)</h2>
<blockquote>
  <strong>नवीनतम आधिकारिक सर्वेक्षण (Survey of India - SoI & NHO Update):</strong><br/>
  सर्वे ऑफ इंडिया तथा राष्ट्रीय हाइड्रोग्राफिक संगठन (NHO) के वैज्ञानिक सर्वेक्षण के अनुसार भारत की कुल तटरेखा की अद्यतन लंबाई <strong>11,098.81 किमी.</strong> है (जिसमें मुख्य भूमि की तटरेखा 7,870.51 किमी. तथा द्वीपीय तटरेखा शामिल है)। पूर्व में यह आंकड़ा 7,516.6 किमी. दर्ज था।
</blockquote>

<p><strong>भारत के 9 तटीय राज्य (पश्चिम से पूर्व):</strong> गुजरात, महाराष्ट्र, गोवा, कर्नाटक, केरल, तमिलनाडु, आंध्र प्रदेश, ओडिशा, पश्चिम बंगाल।</p>
<p><strong>4 तटीय केन्द्रशासित प्रदेश:</strong> दमन एवं दीव, पुदुचेरी, लक्षद्वीप, अण्डमान एवं निकोबार द्वीप समूह।</p>
<ul>
  <li><strong>सर्वाधिक तटीय सीमा वाला राज्य:</strong> गुजरात (2,340.62 किमी.)</li>
  <li><strong>न्यूनतम तटीय सीमा वाला राज्य:</strong> गोवा (193.95 किमी.)</li>
  <li><strong>सर्वाधिक तटीय सीमा वाला UT:</strong> अण्डमान एवं निकोबार द्वीप समूह (3,083.50 किमी.)</li>
  <li><strong>न्यूनतम तटीय सीमा वाला UT:</strong> पुदुचेरी (42.65 किमी.)</li>
</ul>

<h2>6. प्रमुख समुद्री चैनल, जलडमरूमध्य एवं स्ट्रेट्स (Key Channels & Straits)</h2>
<table>
  <thead>
    <tr>
      <th>चैनल / स्ट्रेट</th>
      <th>विभाजित / जोड़ने वाले क्षेत्र</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>8° चैनल (8 Degree Channel)</strong></td>
      <td>मालदीव एवं मिनिकॉय (लक्षद्वीप) के मध्य</td>
    </tr>
    <tr>
      <td><strong>9° चैनल (9 Degree Channel)</strong></td>
      <td>मिनिकॉय एवं मुख्य लक्षद्वीप समूह के मध्य</td>
    </tr>
    <tr>
      <td><strong>10° चैनल (10 Degree Channel)</strong></td>
      <td>लघु अण्डमान (Little Andaman) एवं कार निकोबार के मध्य</td>
    </tr>
    <tr>
      <td><strong>ग्रेट चैनल (Great Channel)</strong></td>
      <td>इन्दिरा प्वाइंट (ग्रेट निकोबार) एवं सुमात्रा (इंडोनेशिया) के मध्य</td>
    </tr>
    <tr>
      <td><strong>डंकन पास (Duncan Passage)</strong></td>
      <td>दक्षिणी अण्डमान एवं लघु अण्डमान के मध्य</td>
    </tr>
    <tr>
      <td><strong>पाक जलडमरूमध्य (Palk Strait)</strong></td>
      <td>भारत (तमिलनाडु) एवं श्रीलंका के मध्य (मन्नार की खाड़ी)</td>
    </tr>
    <tr>
      <td><strong>आदम का पुल (Adam's Bridge)</strong></td>
      <td>तमिलनाडु (पम्बन द्वीप/रामेश्वरम) एवं श्रीलंका (तलाईमन्नार) के मध्य</td>
    </tr>
    <tr>
      <td><strong>कोको स्ट्रेट (Coco Strait)</strong></td>
      <td>कोको द्वीप (म्यांमार) एवं उत्तरी अण्डमान के मध्य</td>
    </tr>
  </tbody>
</table>
  `.trim();
}

async function seedBharatGkNotes() {
  await connectToDatabase();

  console.log(`\n======================================================`);
  console.log(`🚀 UPLOADING BHARAT GK REVISION NOTES INTO DATABASE`);
  console.log(`======================================================`);

  // 1. Ensure Category "India GK / भारत सामान्य ज्ञान" exists
  let category = await Category.findOne({
    $or: [{ slug: "india-gk" }, { name: "India GK" }, { name: "भारत सामान्य ज्ञान" }],
  });

  if (!category) {
    category = new Category({
      name: "India GK",
      slug: "india-gk",
      description: "Comprehensive India General Knowledge, Geography, and Static GK notes for competitive exams.",
    });
    await category.save();
    console.log(`✨ Created new Category: ID ${category._id} (${category.name})`);
  } else {
    console.log(`ℹ️ Found existing Category: ID ${category._id} (${category.name})`);
  }

  // 2. Define Note Payloads
  const notesToSeed = [
    {
      title: "भारत का सामान्य परिचय — स्थिति, विस्तार एवं महत्वपूर्ण सीमाएं",
      slug: "bharat-ka-samanya-parichay",
      subject: "India GK",
      content: sanitizeContentHtml(convertBharatParichayToHtml()),
      categoryId: category._id,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    {
      title: "भारत के राज्यों की अन्तर्राज्यीय एवं अन्तर्राष्ट्रीय स्थिति, सीमाएं व प्रमुख चैनल",
      slug: "bharat-ke-rajyon-ki-antrarajyiya-avam-antarrashtriya-sthiti",
      subject: "India GK",
      content: sanitizeContentHtml(convertBharatRajyaSthitiToHtml()),
      categoryId: category._id,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  ];

  for (const n of notesToSeed) {
    let existingNote = await Note.findOne({
      $or: [{ slug: n.slug }, { title: n.title }],
    });

    if (!existingNote) {
      existingNote = new Note({
        title: n.title,
        slug: n.slug,
        subject: n.subject,
        content: n.content,
        categoryId: n.categoryId,
        tagIds: [],
        imageIds: [],
        status: n.status,
        publishedAt: n.publishedAt,
      });
      await existingNote.save();
      console.log(`✨ Created & Published Note: ${n.title}`);
      console.log(`   ID: ${existingNote._id} | Slug: /notes/${existingNote.slug}`);
    } else {
      existingNote.title = n.title;
      existingNote.subject = n.subject;
      existingNote.content = n.content;
      existingNote.categoryId = n.categoryId;
      existingNote.status = n.status as ContentStatus;
      if (!existingNote.publishedAt) {
        existingNote.publishedAt = n.publishedAt;
      }
      await existingNote.save();
      console.log(`🔄 Updated Note: ${n.title}`);
      console.log(`   ID: ${existingNote._id} | Slug: /notes/${existingNote.slug}`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 ALL BHARAT GK NOTES SUCCESSFULLY UPLOADED & PUBLISHED`);
  console.log(`======================================================\n`);
}

seedBharatGkNotes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal Note Seeding Error:", err);
    process.exit(1);
  });
