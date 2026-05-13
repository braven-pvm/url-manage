import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin", label: "All Redirects" },
  { href: "/admin/redirects/new", label: "New Redirect" },
  { href: "/admin/tags", label: "Tags & Categories" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[var(--pvm-bg)] text-[var(--pvm-fg)]">
      <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-[var(--pvm-accent)]" />
      <div className="flex min-h-screen pt-[3px]">
        <aside className="hidden w-72 shrink-0 border-r border-[var(--pvm-border)] bg-[#08223d] text-white md:flex md:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <Link className="block" href="/admin">
              <span className="block text-[17px] font-bold leading-tight">
                PVM URL Admin
              </span>
              <span className="mt-1 block text-xs font-medium uppercase tracking-[0.08em] text-white/60">
                Managed Redirects
              </span>
            </Link>
          </div>
          <nav
            aria-label="Desktop admin navigation"
            className="flex flex-1 flex-col gap-1 px-3 py-4"
          >
            {navLinks.map((link) => (
              <Link
                className="rounded-md px-3 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10 hover:text-white"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-[3px] z-40 border-b border-[var(--pvm-border)] bg-white/95 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <Link className="min-w-0 md:hidden" href="/admin">
                <span className="block truncate text-sm font-bold">PVM URL Admin</span>
                <span className="block truncate text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                  Managed Redirects
                </span>
              </Link>
              <div className="hidden min-w-0 md:block">
                <p className="text-sm font-semibold">Admin workspace</p>
                <p className="text-xs text-slate-500">Managed redirects</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <Link
                  className="rounded-md border border-[var(--pvm-border)] px-3 py-2 text-sm font-semibold text-[var(--pvm-fg)] transition hover:border-[var(--pvm-fg)]"
                  href="/admin/settings"
                >
                  Settings
                </Link>
                <Link
                  className="rounded-md bg-[var(--pvm-fg)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#123253]"
                  href="/admin/redirects/new"
                >
                  New redirect
                </Link>
                <UserButton />
              </div>
            </div>
            <nav
              aria-label="Mobile admin navigation"
              className="flex gap-2 overflow-x-auto border-t border-[var(--pvm-border)] px-4 py-2 md:hidden"
            >
              {navLinks.map((link) => (
                <Link
                  className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-[var(--pvm-fg)]"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
