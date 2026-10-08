"use client";

import { useState, createContext, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

interface MobileSidebarContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export const useMobileSidebar = () => useContext(MobileSidebarContext);

interface AdminShellProps {
  adminEmail: string;
  children: React.ReactNode;
}

export function AdminShell({ adminEmail, children }: AdminShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar automatically on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Prevent background body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const value = {
    isOpen: isMobileOpen,
    open: () => setIsMobileOpen(true),
    close: () => setIsMobileOpen(false),
    toggle: () => setIsMobileOpen((prev) => !prev),
  };

  return (
    <MobileSidebarContext.Provider value={value}>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
        {/* Responsive Sidebar (Desktop Fixed + Mobile Slide-over Drawer) */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminHeader adminEmail={adminEmail} />
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 bg-slate-50/80">
            {children}
          </main>
        </div>
      </div>
    </MobileSidebarContext.Provider>
  );
}
