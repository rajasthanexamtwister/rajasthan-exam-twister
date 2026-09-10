import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/server/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      {/* Sidebar navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader adminEmail={session.email} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/80">
          {children}
        </main>
      </div>
    </div>
  );
}
