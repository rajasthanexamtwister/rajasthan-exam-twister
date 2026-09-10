import { LogoutButton } from "./logout-button";
import { UserCheck, Shield } from "lucide-react";

interface AdminHeaderProps {
  adminEmail: string;
}

export function AdminHeader({ adminEmail }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/70 rounded-full text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-amber-600" />
          <span>Operator Workspace</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 text-sm">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <UserCheck className="w-4 h-4 text-slate-700" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="font-medium text-slate-900 leading-tight">Admin User</div>
            <div className="text-xs text-slate-500 truncate max-w-[200px]">{adminEmail}</div>
          </div>
        </div>
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />
        <LogoutButton />
      </div>
    </header>
  );
}
