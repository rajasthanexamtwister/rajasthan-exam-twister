"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
  Clock,
  Award,
  ArrowRight,
  Lock,
  PlayCircle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import clsx from "clsx";
import { trackStudentLogin, trackGAEvent } from "@/components/analytics/gtag-events";

interface TestPaper {
  quizId: string;
  title: string;
  slug: string;
  testType: string;
  order: number;
  isFreeDemo: boolean;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  difficulty?: string;
}

interface TestSeriesPaperListProps {
  seriesTitle: string;
  quizzes: TestPaper[];
}

export function TestSeriesPaperList({
  seriesTitle,
  quizzes,
}: TestSeriesPaperListProps) {
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);

  const handleStandardMockLogin = (quizSlug: string) => {
    trackStudentLogin("google");
    trackGAEvent("test_series_gate_login", {
      quiz_slug: quizSlug,
      series_title: seriesTitle,
    });
    signIn("google", {
      callbackUrl: `/quizzes/${quizSlug}/attempt?mode=exam`,
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-[#0B132B] font-heading">
            Mock Test Papers &amp; Schedule ({quizzes.length} Papers)
          </h2>
          <p className="text-xs text-slate-500">
            Click on any test paper to start your online examination simulation.
          </p>
        </div>

        {!isAuthenticated && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Test #1 Free Demo &bull; Sign in for Full Series</span>
          </div>
        )}
      </div>

      <div className="space-y-3.5">
        {quizzes.map((quiz, idx) => {
          const isFree = quiz.isFreeDemo || idx === 0;
          const canAttemptDirectly = isFree || isAuthenticated;

          return (
            <div
              key={quiz.quizId || idx}
              className={clsx(
                "bg-white rounded-2xl border-2 p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs",
                isFree
                  ? "border-emerald-300 hover:border-emerald-400 bg-emerald-50/20"
                  : "border-amber-200/80 hover:border-amber-300"
              )}
            >
              {/* Paper Details */}
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-[#0B132B] font-heading">
                    Paper #{idx + 1}
                  </span>
                  {isFree ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Free Demo Mock
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                      Full Model Paper
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-[#0B132B] truncate font-heading">
                  {quiz.title}
                </h3>

                {/* Specs */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{quiz.durationMinutes} Mins</span>
                  </div>
                  <span>&bull;</span>
                  <div className="flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>{quiz.totalQuestions} Questions</span>
                  </div>
                  <span>&bull;</span>
                  <div className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>{quiz.totalMarks} Marks</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                {canAttemptDirectly ? (
                  <Link
                    href={`/quizzes/${quiz.slug}/attempt?mode=exam`}
                    className={clsx(
                      "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs font-heading",
                      isFree
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                    )}
                  >
                    <span>{isFree ? "Start Free Demo" : "Start Mock Test"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStandardMockLogin(quiz.slug)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0B132B] hover:bg-slate-800 text-amber-400 transition-all shadow-xs font-heading cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sign In to Unlock</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
