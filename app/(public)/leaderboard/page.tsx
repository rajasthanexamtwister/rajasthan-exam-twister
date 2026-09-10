import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { QuizAttemptRepository } from "@/server/repositories/quiz-attempt";
import { Trophy, Medal, Award, Flame, Target, CheckCircle2, User, ArrowRight } from "lucide-react";
import clsx from "clsx";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Student Leaderboard & Top Scorers — Rajasthan Exam Twister",
  description:
    "Check top-ranking students across Rajasthan competitive exam mock tests and quizzes. Practice daily and climb the Rajasthan Exam Twister leaderboard!",
};

interface LeaderboardPageProps {
  searchParams: {
    window?: string;
  };
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const activeWindow = searchParams.window || "7";
  let windowDays = 7;
  if (activeWindow === "30") {
    windowDays = 30;
  } else if (activeWindow === "all" || activeWindow === "0") {
    windowDays = 0;
  }

  const leaderboard = await QuizAttemptRepository.getLeaderboard(windowDays, 50);

  const top3 = leaderboard.slice(0, 3);
  const remainingRankings = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
            <Trophy className="w-4 h-4 text-amber-700" />
            <span>Hall of Fame & Rankings</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight">
            Student Leaderboard
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Real-time performance rankings based on verified quiz scores and accuracy across all Rajasthan competitive exam tests.
          </p>
        </div>

        {/* Time Window Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-2xl bg-white border border-amber-200/80 shadow-xs gap-1">
            <Link
              href="/leaderboard?window=7"
              className={clsx(
                "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                activeWindow === "7"
                  ? "bg-[#0B132B] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              This Week
            </Link>
            <Link
              href="/leaderboard?window=30"
              className={clsx(
                "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                activeWindow === "30"
                  ? "bg-[#0B132B] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              This Month
            </Link>
            <Link
              href="/leaderboard?window=all"
              className={clsx(
                "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                activeWindow === "all"
                  ? "bg-[#0B132B] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              All Time
            </Link>
          </div>
        </div>

        {/* Empty State */}
        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Be the First on the Board!</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No ranked student attempts recorded for this time window yet. Log in with Google and complete any quiz to claim rank #1!
            </p>
            <Link
              href="/quizzes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm transition-all"
            >
              <span>Explore Quizzes & Take Test</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* 2nd Place (Silver) */}
                {top3[1] && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center text-center relative shadow-xs order-2 sm:order-1 sm:mt-4">
                    <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold uppercase border border-slate-300 shadow-xs">
                      🥈 Rank #2
                    </div>
                    <div className="relative w-14 h-14 rounded-full overflow-hidden ring-3 ring-slate-300 bg-slate-100 my-2">
                      {top3[1].avatarUrl ? (
                        <Image
                          src={top3[1].avatarUrl}
                          alt={top3[1].studentName}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 font-extrabold text-lg">
                          {(top3[1].studentName || "S").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-1 truncate max-w-[160px]">
                      {top3[1].studentName}
                    </h4>
                    <div className="mt-3 text-center space-y-1">
                      <div className="text-xl font-extrabold text-slate-900">{top3[1].totalScore} pts</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {top3[1].totalAttempts} {top3[1].totalAttempts === 1 ? "Quiz" : "Quizzes"} &bull; {top3[1].accuracyPercentage}% Acc.
                      </div>
                    </div>
                  </div>
                )}

                {/* 1st Place (Gold Champion) */}
                {top3[0] && (
                  <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-amber-400 p-6 flex flex-col items-center text-center relative shadow-md order-1 sm:order-2">
                    <div className="absolute -top-3.5 px-3.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase shadow-xs flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Rank #1 Champion</span>
                    </div>
                    <div className="relative w-18 h-18 rounded-full overflow-hidden ring-4 ring-amber-400 bg-amber-100 my-2">
                      {top3[0].avatarUrl ? (
                        <Image
                          src={top3[0].avatarUrl}
                          alt={top3[0].studentName}
                          width={72}
                          height={72}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-900 font-black text-2xl">
                          {(top3[0].studentName || "S").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h4 className="font-black text-[#0B132B] text-base mt-1 truncate max-w-[180px]">
                      {top3[0].studentName}
                    </h4>
                    <div className="mt-3 text-center space-y-1">
                      <div className="text-2xl font-black text-amber-600">{top3[0].totalScore} pts</div>
                      <div className="text-xs text-slate-600 font-semibold">
                        {top3[0].totalAttempts} {top3[0].totalAttempts === 1 ? "Quiz" : "Quizzes"} &bull; {top3[0].accuracyPercentage}% Accuracy
                      </div>
                    </div>
                  </div>
                )}

                {/* 3rd Place (Bronze) */}
                {top3[2] && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center text-center relative shadow-xs order-3 sm:order-3 sm:mt-6">
                    <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-700 text-white text-[10px] font-extrabold uppercase shadow-xs">
                      🥉 Rank #3
                    </div>
                    <div className="relative w-14 h-14 rounded-full overflow-hidden ring-3 ring-amber-700/60 bg-amber-50 my-2">
                      {top3[2].avatarUrl ? (
                        <Image
                          src={top3[2].avatarUrl}
                          alt={top3[2].studentName}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-800 font-extrabold text-lg">
                          {(top3[2].studentName || "S").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-1 truncate max-w-[160px]">
                      {top3[2].studentName}
                    </h4>
                    <div className="mt-3 text-center space-y-1">
                      <div className="text-xl font-extrabold text-slate-900">{top3[2].totalScore} pts</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {top3[2].totalAttempts} {top3[2].totalAttempts === 1 ? "Quiz" : "Quizzes"} &bull; {top3[2].accuracyPercentage}% Acc.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Rankings Table */}
            <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Medal className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-extrabold text-[#0B132B] uppercase tracking-wider">
                    Full Leaderboard Rankings
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {leaderboard.length} Ranked Aspirants
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {leaderboard.map((student: any, idx: number) => {
                  const rank = idx + 1;
                  return (
                    <div
                      key={student.studentId?.toString() || idx}
                      className={clsx(
                        "px-6 py-3.5 flex items-center justify-between gap-4 transition-colors hover:bg-amber-50/50",
                        rank === 1 && "bg-amber-50/30",
                        rank === 2 && "bg-slate-50/50",
                        rank === 3 && "bg-amber-50/20"
                      )}
                    >
                      {/* Left: Rank + Avatar + Name */}
                      <div className="flex items-center gap-3.5 truncate">
                        <span
                          className={clsx(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                            rank === 1
                              ? "bg-amber-400 text-slate-950 shadow-xs"
                              : rank === 2
                              ? "bg-slate-200 text-slate-800"
                              : rank === 3
                              ? "bg-amber-700 text-white"
                              : "bg-slate-100 text-slate-600 font-bold"
                          )}
                        >
                          {rank}
                        </span>

                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0 ring-1 ring-slate-200">
                          {student.avatarUrl ? (
                            <Image
                              src={student.avatarUrl}
                              alt={student.studentName}
                              width={32}
                              height={32}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700 font-bold text-xs">
                              {(student.studentName || "S").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="truncate">
                          <p className="text-xs font-extrabold text-slate-900 truncate">
                            {student.studentName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {student.totalAttempts} {student.totalAttempts === 1 ? "test" : "tests"} completed
                          </p>
                        </div>
                      </div>

                      {/* Right: Accuracy & Score */}
                      <div className="flex items-center gap-6 shrink-0 text-right">
                        <div className="hidden sm:block text-right">
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            {student.accuracyPercentage}% Accuracy
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-black text-[#0B132B] block">
                            {student.totalScore}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                            Marks
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA Banner */}
        <div className="bg-[#0B132B] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md border border-amber-400/30">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-black text-amber-400">Want your name on the Leaderboard?</h3>
            <p className="text-xs text-slate-300 max-w-md">
              Sign in with your Google account, take any mock test, and track your daily rank progression.
            </p>
          </div>
          <Link
            href="/quizzes"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm transition-all whitespace-nowrap"
          >
            Start Practicing Now &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
