import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/server/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

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
    <AdminShell adminEmail={session.email}>
      {children}
    </AdminShell>
  );
}
