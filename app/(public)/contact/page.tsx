import { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, MessageSquare, ArrowLeft, Clock } from "lucide-react";
import { getSiteUrl } from "@/server/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Contact Us | Rajasthan Exam Twister",
  description:
    "Contact the Rajasthan Exam Twister editorial & student support team for inquiries, study guidance, content feedback, and platform support.",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-900">
              <Mail className="w-7 h-7 text-amber-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B132B]">
                Contact Us
              </h1>
              <p className="text-xs text-slate-500">
                We'd love to hear from you. Get in touch with our student support & content team.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Official Email */}
          <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B132B]">Official Email</h3>
              <p className="text-xs text-slate-500 mt-1">For student queries, editorial feedback & technical support.</p>
            </div>
            <a
              href="mailto:contact@rajasthanexamtwister.in"
              className="text-xs font-bold text-amber-800 hover:underline block pt-1"
            >
              contact@rajasthanexamtwister.in
            </a>
          </div>

          {/* Card 2: Support Hours */}
          <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B132B]">Working Hours</h3>
              <p className="text-xs text-slate-500 mt-1">Our editorial & response team operates:</p>
            </div>
            <p className="text-xs font-bold text-slate-800">
              Mon - Sat: 9:00 AM - 7:00 PM IST
            </p>
          </div>

          {/* Card 3: Location */}
          <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B132B]">Headquarters</h3>
              <p className="text-xs text-slate-500 mt-1">Rajasthan Competitive Examination Hub</p>
            </div>
            <p className="text-xs font-bold text-slate-800">
              Jaipur, Rajasthan, India (302001)
            </p>
          </div>
        </div>

        {/* Contact Guidance Box */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-[#0B132B]">
            <MessageSquare className="w-5 h-5 text-amber-600" />
            <span>How Can We Help You Today?</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">📚 Content or Question Corrections</span>
              <p className="text-slate-600">
                Spotted an incorrect option or outdated government notification? Email us the question title and subject name for instant review.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">📝 Student Quiz Submissions</span>
              <p className="text-slate-600">
                Want to share your custom quiz JSON files? Use our student <Link href="/quiz-tools/create" className="text-amber-700 font-bold underline">Quiz Converter</Link> or send JSON files to our support team.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
