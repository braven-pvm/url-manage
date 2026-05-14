"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ADMIN_ROLE_LABELS,
  hasAdminRole,
  type AdminRoleName,
} from "@/lib/admin-roles";
import { cleanAdminPath } from "@/lib/admin-routes";

type NavLink = {
  href: string;
  icon: () => ReactNode;
  label: string;
  minimumRole?: AdminRoleName;
};

const navGroups: { label: string; links: NavLink[] }[] = [
  {
    label: "Overview",
    links: [{ href: "/dashboard", icon: GridIcon, label: "Dashboard" }],
  },
  {
    label: "Redirects",
    links: [
      { href: "/redirects", icon: RedirectIcon, label: "All Redirects" },
      {
        href: "/redirects/new",
        icon: PlusCircleIcon,
        label: "New Redirect",
        minimumRole: "EDITOR",
      },
    ],
  },
  {
    label: "Organisation",
    links: [
      {
        href: "/tags",
        icon: TagIcon,
        label: "Tags & Categories",
        minimumRole: "EDITOR",
      },
    ],
  },
  {
    label: "System",
    links: [
      {
        href: "/access",
        icon: AccessIcon,
        label: "Access",
        minimumRole: "ADMINISTRATOR",
      },
      {
        href: "/settings",
        icon: SettingsIcon,
        label: "Settings",
        minimumRole: "ADMINISTRATOR",
      },
    ],
  },
];

type AdminShellProps = Readonly<{
  adminEmail?: string;
  adminRole?: AdminRoleName;
  children: ReactNode;
  redirectCount?: number;
}>;

export function AdminShell({
  adminEmail,
  adminRole = "VIEWER",
  children,
  redirectCount,
}: AdminShellProps) {
  const pathname = normalizePathname(usePathname() ?? "/redirects");
  const breadcrumb = getBreadcrumb(pathname);
  const redirectCountLabel =
    typeof redirectCount === "number" ? redirectCount.toLocaleString("en-ZA") : null;
  const canEdit = hasAdminRole(adminRole, "EDITOR");
  const canAdminister = hasAdminRole(adminRole, "ADMINISTRATOR");
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      links: group.links.filter(
        (link) => !link.minimumRole || hasAdminRole(adminRole, link.minimumRole),
      ),
    }))
    .filter((group) => group.links.length > 0);

  return (
    <div className="min-h-screen bg-[var(--pvm-bg)] text-[var(--pvm-fg)]">
      <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-[var(--pvm-accent)]" />
      <aside className="fixed bottom-0 left-0 top-[3px] z-40 hidden w-[248px] flex-col bg-[#0b243e] text-white md:flex">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--pvm-accent)] text-sm font-black text-[var(--pvm-fg)]"
            href="/dashboard"
          >
            P
          </Link>
          <Link className="min-w-0" href="/dashboard">
            <span className="block truncate text-sm font-bold leading-tight">
              PVM URL Admin
            </span>
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Managed redirects
            </span>
          </Link>
        </div>
        <nav
          aria-label="Admin navigation"
          className="flex flex-1 flex-col gap-6 px-3 py-5"
        >
          {visibleNavGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.links.map((link) => {
                  const active = isActive(pathname, link.href);
                  const Icon = link.icon;

                  return (
                    <Link
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-[#24382f] text-[var(--pvm-accent)]"
                          : "text-slate-300 hover:bg-white/7 hover:text-white"
                      }`}
                      href={link.href}
                      key={link.href}
                    >
                      <Icon />
                      <span className="min-w-0 flex-1 truncate">{link.label}</span>
                      {link.href === "/redirects" && redirectCountLabel ? (
                        <span
                          aria-hidden="true"
                          className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300"
                        >
                          {redirectCountLabel}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {adminEmail ?? "Admin user"}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {ADMIN_ROLE_LABELS[adminRole]}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-[3px] z-30 border-b border-[var(--pvm-border)] bg-white md:ml-[248px]">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--pvm-accent)] text-sm font-black text-[var(--pvm-fg)] md:hidden"
              href="/dashboard"
            >
              P
            </Link>
            <p className="truncate text-sm text-[var(--pvm-muted)]">
              {breadcrumb.parent}
              <span className="px-1.5 text-slate-400">/</span>
              <span className="font-semibold text-[var(--pvm-fg)]">
                {breadcrumb.current}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canAdminister ? (
              <Link
                className="hidden rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pvm-fg)] shadow-sm transition hover:border-[var(--pvm-fg)] sm:inline-flex"
                href="/settings"
              >
                Settings
              </Link>
            ) : null}
            {canEdit ? (
              <Link
                className="rounded-md bg-[var(--pvm-fg)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123253]"
                href="/redirects/new"
              >
                + New redirect
              </Link>
            ) : null}
          </div>
        </div>
        <nav
          aria-label="Mobile admin navigation"
          className="flex gap-2 overflow-x-auto border-t border-[var(--pvm-border)] px-4 py-2 md:hidden"
        >
          {visibleNavGroups.flatMap((group) => group.links).map((link) => (
              <Link
                className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isActive(pathname, link.href)
                    ? "bg-[var(--pvm-fg)] text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-[var(--pvm-fg)]"
                }`}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
          ))}
        </nav>
      </header>
      <main className="px-4 py-7 sm:px-6 md:ml-[248px] md:px-8">
        {children}
      </main>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/redirects") {
    return (
      pathname === "/redirects" ||
      (pathname.startsWith("/redirects/") && pathname !== "/redirects/new")
    );
  }

  return pathname === href;
}

function normalizePathname(pathname: string) {
  if (pathname.startsWith("/visual-qa/admin/detail")) {
    return "/redirects/visual";
  }

  if (pathname.startsWith("/visual-qa/admin/edit")) {
    return "/redirects/visual";
  }

  if (pathname.startsWith("/visual-qa/dashboard")) {
    return "/dashboard";
  }

  if (pathname.startsWith("/visual-qa/tags")) {
    return "/tags";
  }

  if (pathname.startsWith("/visual-qa/access")) {
    return "/access";
  }

  if (pathname.startsWith("/visual-qa/settings")) {
    return "/settings";
  }

  if (pathname.startsWith("/visual-qa/admin")) {
    return "/redirects";
  }

  return cleanAdminPath(pathname);
}

function getBreadcrumb(pathname: string) {
  if (pathname === "/dashboard") {
    return { current: "Dashboard", parent: "PVM URL Admin" };
  }

  if (pathname === "/tags") {
    return { current: "Tags & Categories", parent: "Organisation" };
  }

  if (pathname === "/settings") {
    return { current: "Settings", parent: "System" };
  }

  if (pathname === "/access") {
    return { current: "Access Management", parent: "System" };
  }

  if (pathname === "/redirects/new") {
    return { current: "New Redirect", parent: "Redirects" };
  }

  if (pathname.startsWith("/redirects/")) {
    return { current: "Redirect", parent: "Redirects" };
  }

  return { current: "All Redirects", parent: "Redirects" };
}

function GridIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function RedirectIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M7 7h8l-2-2m2 2-2 2M17 17H9l2 2m-2-2 2-2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 7v10m-5-5h10M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M4 5v6l8 8 7-7-8-7H4Zm4 4h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function AccessIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 9a6 6 0 0 1 12 0m4.5-7v-2.5a2.5 2.5 0 0 0-5 0V13m-1 0h7v7h-7v-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8 3.5h2M2 12h2m12.95 4.95 1.42 1.42M5.64 5.64l1.41 1.41m9.9 0 1.42-1.41M5.64 18.36l1.41-1.41" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}
