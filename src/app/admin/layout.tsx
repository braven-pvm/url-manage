import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [actor, redirectCount] = await Promise.all([
    requireAdminRole("VIEWER"),
    prisma.redirect.count(),
  ]);

  return (
    <AdminShell
      adminEmail={actor.email}
      adminRole={actor.role}
      redirectCount={redirectCount}
    >
      {children}
    </AdminShell>
  );
}
