import Link from "next/link";
import {
  FileText,
  BookOpen,
  Image as ImageIcon,
  UploadCloud,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboardPage() {
  // Empty state stats for Batch 1 Foundation shell
  const stats = [
    {
      name: "Blogs",
      total: 0,
      published: 0,
      drafts: 0,
      icon: FileText,
      href: "/admin/blogs",
      newHref: "/admin/blogs/new",
      color: "from-blue-600 to-indigo-600",
      accent: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      name: "Revision Notes",
      total: 0,
      published: 0,
      drafts: 0,
      icon: BookOpen,
      href: "/admin/notes",
      newHref: "/admin/notes/new",
      color: "from-amber-500 to-orange-600",
      accent: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      name: "Media Files",
      total: 0,
      published: 0,
      drafts: 0,
      icon: ImageIcon,
      href: "/admin/media",
      newHref: "/admin/media",
      color: "from-emerald-500 to-teal-600",
      accent: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      name: "Import Jobs",
      total: 0,
      published: 0,
      drafts: 0,
      icon: UploadCloud,
      href: "/admin/notes/import",
      newHref: "/admin/notes/import",
      color: "from-purple-500 to-violet-600",
      accent: "bg-purple-50 text-purple-800 border-purple-200",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Banner / Welcome */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
              Batch 1 Foundation
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              System Online
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Admin CMS Dashboard
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Welcome to the Rajasthan Exam Twister content control panel. Manage exam notes,
            current affairs blogs, legacy HTML imports, and media assets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <Link
            href="/admin/blogs/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>New Blog</span>
          </Link>
          <Link
            href="/admin/notes/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Note</span>
          </Link>
        </div>

        {/* Decorative subtle background pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-white shadow-md`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${stat.accent}`}>
                  {stat.name}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stat.total}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                  <span>
                    <strong className="text-slate-800 font-semibold">{stat.published}</strong> Published
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-slate-800 font-semibold">{stat.drafts}</strong> Drafts
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={stat.href}
                  className="text-xs font-semibold text-slate-600 hover:text-amber-600 flex items-center gap-1 group-hover:underline"
                >
                  Manage {stat.name}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Section: Recent Content & Quick Migration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Content Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Content</h2>
              <p className="text-xs text-slate-500">Latest edited blogs and master notes</p>
            </div>
            <Link
              href="/admin/notes"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              View all
            </Link>
          </div>

          {/* Empty state container */}
          <div className="py-12 px-4 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No content published or drafted yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Ready to start! Write a new blog, author exam notes, or import your existing legacy HTML handbook files.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link
                href="/admin/notes/import"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
              >
                <UploadCloud className="w-4 h-4 text-amber-600" />
                Import HTML Notes
              </Link>
              <Link
                href="/admin/blogs/new"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                Create First Blog
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions & System Status Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-500 mb-4">Frequently used management tools</p>

            <div className="space-y-2.5">
              <Link
                href="/admin/notes/import"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-amber-50/60 hover:border-amber-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-amber-900">
                      Bulk HTML Importer
                    </div>
                    <div className="text-[11px] text-slate-500">Migrate legacy notes</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/admin/categories"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-amber-50/60 hover:border-amber-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                      Exam Categories
                    </div>
                    <div className="text-[11px] text-slate-500">REET, RPSC, CET, GK</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-amber-50/60 hover:border-amber-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Site Settings</div>
                    <div className="text-[11px] text-slate-500">Title, email, SEO config</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Foundation Info card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Rajasthan Exam Twister CMS</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Batch 1 Foundation active: Authenticated session active with custom JWT in httpOnly cookie.
              Database and Prisma layer ready for Batch 2 (Blogs) and Batch 3 (Notes).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
