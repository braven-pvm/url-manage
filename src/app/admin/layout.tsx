import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminEmail } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminEmail();

  return <AdminShell>{children}</AdminShell>;
}
