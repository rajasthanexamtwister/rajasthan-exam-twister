"use client";

import { LogoutButton } from "./logout-button";
import { UserCheck, Shield, Menu } from "lucide-react";
import { useMobileSidebar } from "./admin-shell";

interface AdminHeaderProps {
  adminEmail: string;
}

export function AdminHeader({ adminEmail }: AdminHeaderProps) {
  const { toggle } = useMobileSidebar();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs shrink-0 z-20">
      <div className="flex items-center gap-2.5">
        {/* Mobile Sidebar Hamburger Toggle Button */}
        <button
          type="button"
          onClick={toggle}
          aria-label="Open Admin Menu"
          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-full text-[11px] sm:text-xs font-bold">
          <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate max-w-[120px] sm:max-w-none">Operator CMS</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-2.5 text-sm">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
            <UserCheck className="w-4 h-4 text-slate-700" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="font-semibold text-slate-900 leading-tight text-xs sm:text-sm">Admin</div>
            <div className="text-[11px] text-slate-500 truncate max-w-[140px] md:max-w-[200px]" title={adminEmail}>
              {adminEmail}
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        <LogoutButton />
      </div>
    </header>
  );
}
