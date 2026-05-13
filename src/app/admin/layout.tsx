import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { requireAdminEmail } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminEmail();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-5 text-sm">
            <Link className="text-base font-semibold" href="/admin">
              PVM URL Admin
            </Link>
            <Link
              className="text-slate-700 hover:text-slate-950"
              href="/admin/redirects/new"
            >
              New redirect
            </Link>
            <Link
              className="text-slate-700 hover:text-slate-950"
              href="/admin/settings"
            >
              Settings
            </Link>
          </nav>
          <UserButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
