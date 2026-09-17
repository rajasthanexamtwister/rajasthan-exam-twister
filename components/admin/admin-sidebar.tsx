"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  UploadCloud,
  Image as ImageIcon,
  CheckSquare,
  FolderTree,
  Tag,
  Settings,
  ExternalLink,
  Users,
} from "lucide-react";
import clsx from "clsx";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Blogs", href: "/admin/blogs", icon: FileText, exact: false },
  { name: "Notes", href: "/admin/notes", icon: BookOpen, exact: false },
  { name: "Quizzes", href: "/admin/quizzes", icon: CheckSquare, exact: false },
  { name: "Quiz Submissions", href: "/admin/quizzes/submissions", icon: FileText, exact: false },
  { name: "Import HTML", href: "/admin/notes/import", icon: UploadCloud, exact: false },
  { name: "Media Library", href: "/admin/media", icon: ImageIcon, exact: false },
  { name: "Categories", href: "/admin/categories", icon: FolderTree, exact: false },
  { name: "Tags", href: "/admin/tags", icon: Tag, exact: false },
  { name: "Students", href: "/admin/students", icon: Users, exact: false },
  { name: "Settings", href: "/admin/settings", icon: Settings, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-amber-500/20">
          RT
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight block leading-tight">
            Exam Twister
          </span>
          <span className="text-xs text-amber-400/90 font-medium">Admin Control CMS</span>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Content & Management
        </div>
        {navigation.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : item.href === "/admin/notes"
            ? pathname === "/admin/notes" ||
              (pathname.startsWith("/admin/notes/") && !pathname.startsWith("/admin/notes/import"))
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-sm shadow-amber-500/25"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/70"
              )}
            >
              <Icon
                className={clsx(
                  "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-slate-950" : "text-slate-400 group-hover:text-amber-400"
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between text-xs text-slate-400 hover:text-amber-400 transition-colors p-2 rounded-md hover:bg-slate-800/50"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            View Public Site
          </span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Live</span>
        </Link>
      </div>
    </aside>
  );
}
