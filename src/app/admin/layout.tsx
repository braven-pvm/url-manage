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
    <div className="min-h-screen bg-[#f3f6f8] text-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="h-1 bg-[#f6c900]" />
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6 text-sm">
            <Link className="flex items-center gap-3 font-semibold" href="/admin">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#00539b] text-sm font-black text-white">
                P
              </span>
              <span>
                <span className="block text-base leading-none text-slate-950">
                  PVM URL Admin
                </span>
                <span className="mt-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Managed redirects
                </span>
              </span>
            </Link>
            <Link
              className="font-medium text-slate-600 hover:text-slate-950"
              href="/admin/redirects/new"
            >
              New redirect
            </Link>
            <Link
              className="font-medium text-slate-600 hover:text-slate-950"
              href="/admin/settings"
            >
              Settings
            </Link>
          </nav>
          <UserButton />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
