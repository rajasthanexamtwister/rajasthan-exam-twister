"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setLoading(true);
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "x-requested-with": "ret-admin",
        },
      });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={
        className ||
        "inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
      }
      title="Sign out of Admin Panel"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      <span>Sign Out</span>
    </button>
  );
}
