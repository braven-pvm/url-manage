import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";

export async function VisualAdminFrame({
  children,
}: Readonly<{ children: ReactNode }>) {
  const redirectCount = await prisma.redirect.count();

  return (
    <AdminShell
      adminEmail="visual-qa@pvm.co.za"
      adminRole="ADMINISTRATOR"
      redirectCount={redirectCount}
    >
      {children}
    </AdminShell>
  );
}
