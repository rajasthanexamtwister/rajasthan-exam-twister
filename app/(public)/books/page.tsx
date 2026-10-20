import { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ExternalLink, ShieldCheck, Star, ShoppingBag, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { getSiteUrl } from "@/server/lib/seo";
import affiliateConfig from "@/config/affiliate-books.json";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "राजस्थान प्रतियोगी परीक्षाओं हेतु सर्वश्रेष्ठ पुस्तकें | Recommended Books",
  description:
    "RPSC, RSSB, REET, CET और Rajasthan Police भर्ती परीक्षाओं के लिए प्रामाणिक एवं सर्वश्रेष्ठ पुस्तकों की संकलित सूची। सीधे Amazon से न्यूनतम मूल्य पर उपलब्ध।",
  keywords: [
    "Rajasthan GK Best Books",
    "Rajasthan Exam Books",
    "Disha Rajasthan Pariksha 20",
    "Rajasthan History Culture Books",
    "Rajasthan Geography Books",
    "Rajasthan Current Affairs Yearly",
    "REET Books",
    "CET Books",
  ],
  alternates: {
    canonical: `${siteUrl}/books`,
  },
  openGraph: {
    title: "राजस्थान प्रतियोगी परीक्षाओं हेतु सर्वश्रेष्ठ पुस्तकें | Rajasthan Exam Twister",
    description:
      "RPSC, RSSB, REET, CET और Police SI/Constable भर्ती परीक्षाओं के लिए विषयवार सर्वश्रेष्ठ पुस्तकों की सूची।",
    url: `${siteUrl}/books`,
    siteName: "Rajasthan Exam Twister",
    type: "website",
  },
};

const booksList = [
  {
    id: "rajasthan_pariksha_20",
    title: affiliateConfig.recommendedBooks.rajasthan_pariksha_20.title,
    link: affiliateConfig.recommendedBooks.rajasthan_pariksha_20.link,
    tag: affiliateConfig.recommendedBooks.rajasthan_pariksha_20.tag,
    description: affiliateConfig.recommendedBooks.rajasthan_pariksha_20.description,
    badge: "20-वर्षीय PYQs स्पेशल",
    highlight: "विगत परीक्षाओं के हल प्रश्न-पत्र",
    features: [
      "RPSC व RSSB के 20 वर्षों के पिछले प्रश्न",
      "विस्तृत व्याख्या सहित प्रामाणिक उत्तर",
      "SET of 2 Books — कॉम्बो पैक",
    ],
    rating: "4.8",
    color: "from-amber-500 to-amber-700",
  },
  {
    id: "rajasthan_history_culture",
    title: affiliateConfig.recommendedBooks.rajasthan_history_culture.title,
    link: affiliateConfig.recommendedBooks.rajasthan_history_culture.link,
    tag: affiliateConfig.recommendedBooks.rajasthan_history_culture.tag,
    description: affiliateConfig.recommendedBooks.rajasthan_history_culture.description,
    badge: "कला व संस्कृति बेस्टसेलर",
    highlight: "लोक देवता, मेले, त्यौहार व दुर्ग",
    features: [
      "नवीनतम 50 जिलों के अनुसार अध्ययन सामग्री",
      "इतिहास, लोक परंपराएं एवं स्थापत्य कला",
      "परीक्षा उपयोगी तथ्य व सारणियाँ",
    ],
    rating: "4.7",
    color: "from-rose-500 to-rose-700",
  },
  {
    id: "rajasthan_geography",
    title: affiliateConfig.recommendedBooks.rajasthan_geography.title,
    link: affiliateConfig.recommendedBooks.rajasthan_geography.link,
    tag: affiliateConfig.recommendedBooks.rajasthan_geography.tag,
    description: affiliateConfig.recommendedBooks.rajasthan_geography.description,
    badge: "भूगोल स्पेशल",
    highlight: "भौतिक प्रदेश, नदियां व अर्थव्यवस्था",
    features: [
      "नवीन संभाग व जिलों का सटीक नक्शा व विवरण",
      "मरुस्थलीकरण, वनस्पति एवं जल प्रबंधन",
      "आर्थिक समीक्षा व नवीनतम आंकड़े",
    ],
    rating: "4.7",
    color: "from-emerald-500 to-emerald-700",
  },
  {
    id: "rajasthan_current_affairs",
    title: affiliateConfig.recommendedBooks.rajasthan_current_affairs.title,
    link: affiliateConfig.recommendedBooks.rajasthan_current_affairs.link,
    tag: affiliateConfig.recommendedBooks.rajasthan_current_affairs.tag,
    description: affiliateConfig.recommendedBooks.rajasthan_current_affairs.description,
    badge: "वार्षिकांक",
    highlight: "योजनाएं, बजट व समसामयिकी",
    features: [
      "राजस्थान सरकार की फ्लैगशिप योजनाएं",
      "नवीनतम बजट एवं आर्थिक सर्वेक्षण सार",
      "आगामी परीक्षाओं के लिए हाई-यील्ड MCQs",
    ],
    rating: "4.9",
    color: "from-blue-500 to-blue-700",
  },
];

export default function RecommendedBooksPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Back Link & Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>होमपेज पर वापस जाएँ</span>
          </Link>

          <div className="bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] rounded-3xl p-6 sm:p-10 text-white shadow-lg relative overflow-hidden border border-amber-500/20">
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>प्रामाणिक अध्ययन सामग्री व बुक्स</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                राजस्थान प्रतियोगी परीक्षाओं की अनुशंसित पुस्तकें
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                RPSC (RAS, 1st/2nd Grade), RSSB (CET, LDC, VDO), REET और Rajasthan Police की तैयारी कर रहे विद्यार्थियों के लिए विशेषज्ञों द्वारा जांची गई सर्वश्रेष्ठ पुस्तकें।
              </p>
            </div>
          </div>
        </div>

        {/* Amazon Affiliate Transparency Notice */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-slate-800 text-xs sm:text-sm">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold text-amber-950">पारदर्शिता एवं छात्र हित डिस्क्लोज़र:</p>
            <p className="text-slate-700 text-xs">
              {affiliateConfig.disclosure} हम केवल वही पुस्तकें सुझाते हैं जो राजस्थान परीक्षा पाठ्यक्रम के अनुकूल व विद्यार्थियों द्वारा सर्वाधिक सराही गई हैं।
            </p>
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {booksList.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6 sm:p-7 space-y-4">
                
                {/* Top Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300/50">
                    {book.badge}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{book.rating} / 5</span>
                  </div>
                </div>

                {/* Book Header */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-amber-700">{book.tag}</div>
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                    {book.title}
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {book.description}
                  </p>
                </div>

                {/* Bullet Highlights */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-800">प्रमुख विशेषताएं:</p>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {book.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Bottom Action Footer */}
              <div className="p-6 sm:p-7 pt-0">
                <a
                  href={book.link}
                  target="_blank"
                  rel="sponsored nofollow noopener"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#FF9900] hover:bg-[#e88b00] active:scale-[0.99] text-slate-950 font-bold px-5 py-3 rounded-2xl text-sm transition-all shadow-sm hover:shadow"
                >
                  <ShoppingBag className="w-4 h-4 text-slate-950" />
                  <span>Amazon पर मूल्य व छूट देखें</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  आधिकारिक Amazon इंडिया स्टोर लिंक • सुरक्षित व प्रामाणिक डिलीवरी
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* Bottom Educational Support Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <span>मुफ़्त ऑनलाइन रिवीजन नोट्स व मॉक टेस्ट</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              किताबों के साथ-साथ राजस्थान GK के हस्तलिखित नोट्स और 3,000+ MCQs का मुफ़्त अभ्यास करें।
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/notes"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              मुफ़्त नोट्स पढ़ें
            </Link>
            <Link
              href="/quizzes"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors shadow-xs"
            >
              क्विज़ हल करें
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
