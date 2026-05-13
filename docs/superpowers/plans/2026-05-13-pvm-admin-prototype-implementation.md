# PVM Admin Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the design-team prototype in `docs/prototype` as a polished, production-ready PVM URL admin experience backed by the existing Next.js, Clerk, Prisma, and Vercel app.

**Architecture:** Keep the real App Router routes, server actions, Prisma models, and Clerk protection. Extract the prototype's brand system into reusable admin UI components, then apply those components across dashboard, redirect list, create/edit, click analytics, and tags/categories management. Add persisted category/tag catalog support only where it improves admin workflow; redirects continue to store the operational category and tags for simple querying.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, Clerk, Prisma/Postgres, Tailwind CSS v4, Vitest, Testing Library, Playwright for browser verification.

---

## Prototype And Brand Inputs

- `docs/prototype/brand-spec.md`: authoritative design tokens and rules.
- `docs/prototype/mp3xe7pz-image.png`: current branded redirect list screenshot.
- `docs/prototype/mp3xf04g-image.png`: current branded edit/detail screenshot.
- `docs/prototype/pvm-url-admin.html`: fuller admin prototype with dashboard, sidebar, list, create form, detail analytics, and tags/categories views.
- `docs/prototype/index.html`: alternate/full static prototype export.

Design rules to preserve:
- Yellow appears only as a 3px top stripe.
- Primary CTAs are dark navy with white text, not yellow.
- Cards are white on `#EEF1F5` with 1px `#E5E7EB` border and 8-12px radius.
- Short URLs, destination URLs, and codes use monospace.
- Table headers are uppercase, 10-11px, letter-spaced, muted.
- Category and purpose values render as colored badges; tag chips stay neutral grey.
- Row edit actions remain inline text links.

## File Structure

- Modify `src/app/globals.css`: global brand CSS variables, body background, font stacks, shared focus defaults.
- Create `src/components/admin/ui.tsx`: reusable admin primitives: `AdminCard`, `PageHeader`, `Badge`, `TagChip`, `MetricCard`, `SectionHeader`, `UrlDisplay`.
- Create `src/components/admin/ui.test.tsx`: tests for badge classes, tag rendering, and URL links/copy affordance.
- Create `src/components/admin/AdminShell.tsx`: sidebar/topbar shell based on prototype, using real Next links and Clerk `UserButton`.
- Modify `src/app/admin/layout.tsx`: require admin and render `AdminShell`.
- Modify `src/app/admin/layout.test.tsx`: verify auth gate, nav, user menu, and children.
- Modify `prisma/schema.prisma`: add optional persisted catalog tables `RedirectCategory` and `RedirectTag`.
- Create `prisma/migrations/20260513120000_add_redirect_taxonomy_catalog/migration.sql`: migration for catalog tables.
- Create `src/lib/redirect-taxonomy.ts`: category/tag catalog normalization, counting, upsert, rename, delete guards.
- Create `src/lib/redirect-taxonomy.test.ts`: unit tests for pure taxonomy helpers and mutation behavior against a fake db.
- Modify `src/lib/redirect-service.ts`: upsert category/tag catalog entries during create/update.
- Modify `src/lib/redirect-service.test.ts`: verify category/tag upserts happen and redirect strings remain normalized.
- Modify `src/app/admin/actions.ts`: add taxonomy server actions and revalidation.
- Create `src/lib/admin-dashboard.ts`: dashboard aggregates and click series/referrer transforms.
- Create `src/lib/admin-dashboard.test.ts`: pure tests for click aggregation and top referrers.
- Create `src/app/admin/dashboard/page.tsx`: real dashboard route matching the prototype's KPI/activity direction.
- Modify `src/app/admin/page.tsx`: branded redirects list with KPI strip, filter bar, category/purpose/tag filters, and prototype table layout.
- Modify `src/components/admin/RedirectTable.tsx`: prototype table layout, badges, tag chips, full clickable short/destination URLs.
- Modify `src/components/admin/RedirectTable.test.tsx`: assert full URL visibility, badges, tags, purpose, click count, edit link.
- Modify `src/components/admin/RedirectForm.tsx`: prototype form sections, short URL preview, status/QR coming-soon card, better tags/purpose/category layout.
- Modify `src/components/admin/RedirectForm.test.tsx`: assert category options, purpose options, short URL preview, locked edit code, and save/create CTAs.
- Modify `src/app/admin/redirects/new/page.tsx`: prototype create page shell and category/tag suggestions.
- Modify `src/app/admin/redirects/[id]/page.tsx`: prototype detail/edit page with summary URL cards, metrics, recent clicks table, and analytics panels.
- Create `src/app/admin/tags/page.tsx`: tags/categories management page using real counts and guarded actions.
- Create `src/app/admin/tags/page.test.tsx`: render test for categories, tags, counts, purpose reference cards.
- Modify `src/components/admin/CopyButton.tsx`: match prototype sizing and optional compact style.
- Create `src/components/admin/CopyButton.test.tsx`: verify copied state still works after styling changes.

## Data And Behavior Decisions

- Redirect `category`, `purpose`, and `tags` remain on `Redirect` for simple filtering and stable existing query behavior.
- New catalog tables are admin convenience data, not the source of redirect truth.
- Creating or editing a redirect upserts the category and tags into the catalog.
- Renaming a category updates both catalog name and existing redirects with that category.
- Renaming a tag updates both catalog slug/label and existing redirect tag arrays.
- Deleting a category or tag is blocked when redirects still use it; the UI shows the count so admins know what to clean up first.
- Raw IP address remains out of scope and is not stored; the app continues to store `ipHash` only.
- QR generation remains explicitly "Coming soon" in this implementation, matching the prototype and the existing V1 boundary.

---

### Task 1: Brand Tokens And Admin UI Primitives

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/admin/ui.tsx`
- Create: `src/components/admin/ui.test.tsx`

- [ ] **Step 1: Write tests for reusable badges, chips, and URL display**

Add `src/components/admin/ui.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, TagChip, UrlDisplay } from "./ui";

describe("admin UI primitives", () => {
  it("renders purpose and category badges with deterministic text", () => {
    render(
      <div>
        <Badge tone="amber">Temporary</Badge>
        <Badge tone="blue">Print / QR</Badge>
        <Badge tone="green">Matched</Badge>
      </div>,
    );

    expect(screen.getByText("Temporary")).toHaveClass("bg-amber-50");
    expect(screen.getByText("Print / QR")).toHaveClass("bg-blue-50");
    expect(screen.getByText("Matched")).toHaveClass("bg-emerald-50");
  });

  it("renders neutral tag chips", () => {
    render(<TagChip>energy-bar</TagChip>);

    expect(screen.getByText("energy-bar")).toHaveClass("bg-[var(--pvm-bg)]");
  });

  it("renders full clickable URLs in monospace", () => {
    render(<UrlDisplay href="https://go.pvm.co.za/ptn-1" label="https://go.pvm.co.za/ptn-1" />);

    expect(
      screen.getByRole("link", { name: "https://go.pvm.co.za/ptn-1" }),
    ).toHaveAttribute("href", "https://go.pvm.co.za/ptn-1");
  });
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run: `npm run test -- src/components/admin/ui.test.tsx`

Expected: FAIL because `src/components/admin/ui.tsx` does not exist.

- [ ] **Step 3: Add brand variables and base page styling**

Modify `src/app/globals.css`:

```css
@import "tailwindcss";

:root {
  --pvm-bg: #eef1f5;
  --pvm-surface: #ffffff;
  --pvm-fg: #0d1f35;
  --pvm-muted: #6b7280;
  --pvm-border: #e5e7eb;
  --pvm-accent: #f5c400;
  --pvm-teal: #0284c7;
  --pvm-green: #16a34a;
  --pvm-amber: #d97706;
  --pvm-purple: #7c3aed;
  --pvm-red: #dc2626;
  --pvm-surface-2: #f8fafc;
  --background: var(--pvm-bg);
  --foreground: var(--pvm-fg);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
}

a {
  text-underline-offset: 2px;
}

::selection {
  background: color-mix(in srgb, var(--pvm-accent) 40%, white);
}
```

- [ ] **Step 4: Implement `src/components/admin/ui.tsx`**

```tsx
import Link from "next/link";
import { CopyButton } from "./CopyButton";

export type BadgeTone =
  | "grey"
  | "green"
  | "amber"
  | "blue"
  | "purple"
  | "red";

const badgeClasses: Record<BadgeTone, string> = {
  grey: "bg-slate-100 text-slate-700",
  green: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border border-amber-200 bg-amber-50 text-amber-700",
  blue: "border border-blue-200 bg-blue-50 text-blue-700",
  purple: "border border-violet-200 bg-violet-50 text-violet-700",
  red: "border border-red-200 bg-red-50 text-red-700",
};

export function AdminCard({
  children,
  className = "",
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <section
      className={`overflow-hidden rounded-[10px] border border-[var(--pvm-border)] bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  actions,
  eyebrow,
  subtitle,
  title,
}: Readonly<{
  actions?: React.ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
}>) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--pvm-border)] px-5 py-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--pvm-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[13px] font-semibold text-[var(--pvm-fg)]">{title}</h2>
        {subtitle ? <p className="mt-1 text-[11.5px] text-[var(--pvm-muted)]">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: Readonly<{
  actions?: React.ReactNode;
  description?: string;
  eyebrow: string;
  title: string;
}>) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--pvm-muted)]">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-tight text-[var(--pvm-fg)]">
          {title}
        </h1>
        {description ? <p className="mt-1 text-[13px] text-[var(--pvm-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function PrimaryLink({
  children,
  href,
}: Readonly<{ children: React.ReactNode; href: string }>) {
  return (
    <Link
      className="inline-flex items-center rounded-md bg-[var(--pvm-fg)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c]"
      href={href}
    >
      {children}
    </Link>
  );
}

export function SecondaryAnchor({
  children,
  href,
}: Readonly<{ children: React.ReactNode; href: string }>) {
  return (
    <a
      className="inline-flex items-center rounded-md border border-[var(--pvm-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--pvm-fg)] transition hover:border-[var(--pvm-fg)]"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

export function Badge({
  children,
  tone = "grey",
}: Readonly<{ children: React.ReactNode; tone?: BadgeTone }>) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-5 ${badgeClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function TagChip({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span className="inline-flex items-center rounded border border-[var(--pvm-border)] bg-[var(--pvm-bg)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--pvm-muted)]">
      {children}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  detail,
}: Readonly<{ label: string; value: string; detail?: string }>) {
  return (
    <AdminCard className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]">
        {label}
      </p>
      <p className="mt-2 text-[26px] font-bold leading-none tracking-tight text-[var(--pvm-fg)] tabular-nums">
        {value}
      </p>
      {detail ? <p className="mt-2 text-[11.5px] text-[var(--pvm-muted)]">{detail}</p> : null}
    </AdminCard>
  );
}

export function UrlDisplay({
  href,
  label,
  showCopy = false,
}: Readonly<{ href: string; label: string; showCopy?: boolean }>) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-[var(--pvm-border)] bg-[var(--pvm-bg)] px-3 py-2 font-mono text-[12.5px] text-[var(--pvm-teal)]">
      <a className="break-all hover:underline" href={href} rel="noreferrer" target="_blank">
        {label}
      </a>
      {showCopy ? (
        <CopyButton
          className="rounded border border-[var(--pvm-border)] bg-white px-2 py-1 font-sans text-[11px] font-medium text-[var(--pvm-muted)] hover:text-[var(--pvm-fg)]"
          copiedLabel="Copied"
          label="Copy"
          value={href}
        />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Run tests for primitives**

Run: `npm run test -- src/components/admin/ui.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/components/admin/ui.tsx src/components/admin/ui.test.tsx
git commit -m "feat: add admin brand primitives"
```

---

### Task 2: Admin Shell Navigation

**Files:**
- Create: `src/components/admin/AdminShell.tsx`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/admin/layout.test.tsx`

- [ ] **Step 1: Update layout test for prototype shell landmarks**

Modify `src/app/admin/layout.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminLayout from "./layout";
import { requireAdminEmail } from "@/lib/admin-auth";

vi.mock("@/lib/admin-auth", () => ({
  requireAdminEmail: vi.fn().mockResolvedValue("admin@pvm.co.za"),
}));

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <button type="button">User menu</button>,
}));

describe("AdminLayout", () => {
  it("requires an allowlisted admin before rendering the prototype shell", async () => {
    render(await AdminLayout({ children: <p>Protected admin content</p> }));

    expect(requireAdminEmail).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Protected admin content")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Admin navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute(
      "href",
      "/admin/dashboard",
    );
    expect(screen.getByRole("link", { name: /All Redirects/ })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(screen.getByRole("link", { name: /New Redirect/ })).toHaveAttribute(
      "href",
      "/admin/redirects/new",
    );
    expect(screen.getByRole("link", { name: /Tags & Categories/ })).toHaveAttribute(
      "href",
      "/admin/tags",
    );
    expect(screen.getByRole("link", { name: /Settings/ })).toHaveAttribute(
      "href",
      "/admin/settings",
    );
    expect(screen.getByRole("button", { name: "User menu" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run: `npm run test -- src/app/admin/layout.test.tsx`

Expected: FAIL because `AdminShell` and new nav links are not implemented.

- [ ] **Step 3: Create `AdminShell`**

Add `src/components/admin/AdminShell.tsx`:

```tsx
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const navGroups = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: "grid" }],
  },
  {
    label: "Redirects",
    items: [
      { href: "/admin", label: "All Redirects", icon: "arrow" },
      { href: "/admin/redirects/new", label: "New Redirect", icon: "plus" },
    ],
  },
  {
    label: "Organisation",
    items: [{ href: "/admin/tags", label: "Tags & Categories", icon: "tag" }],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: "settings" }],
  },
];

export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[var(--pvm-bg)] text-[var(--pvm-fg)]">
      <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-[var(--pvm-accent)]" />
      <div className="flex min-h-screen pt-[3px]">
        <aside className="fixed bottom-0 left-0 top-[3px] hidden w-56 flex-col bg-[var(--pvm-fg)] lg:flex">
          <div className="flex h-[54px] items-center gap-3 border-b border-white/10 px-4">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--pvm-accent)] text-sm font-black text-[var(--pvm-fg)]">
              P
            </span>
            <span>
              <span className="block text-[12.5px] font-semibold leading-tight text-white">
                PVM URL Admin
              </span>
              <span className="mt-0.5 block text-[9.5px] font-semibold uppercase tracking-[0.08em] text-white/35">
                Managed Redirects
              </span>
            </span>
          </div>
          <nav aria-label="Admin navigation" className="flex-1 space-y-2 px-2 py-3">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-2 pb-1 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-white/30">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <Link
                    className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
                    href={item.href}
                    key={item.href}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="border-t border-white/10 p-3 text-xs text-white/45">
            Internal team access
          </div>
        </aside>
        <div className="flex min-h-screen flex-1 flex-col lg:pl-56">
          <header className="sticky top-[3px] z-40 flex h-[54px] items-center gap-4 border-b border-[var(--pvm-border)] bg-white px-5 shadow-sm lg:px-6">
            <Link className="flex items-center gap-3 font-semibold lg:hidden" href="/admin">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--pvm-accent)] text-sm font-black text-[var(--pvm-fg)]">
                P
              </span>
              <span>PVM URL Admin</span>
            </Link>
            <div className="hidden text-[12.5px] text-[var(--pvm-muted)] lg:block">
              PVM URL Admin <span className="px-1 text-[var(--pvm-border)]">/</span>
              <span className="font-medium text-[var(--pvm-fg)]">Managed Redirects</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link
                className="hidden rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--pvm-fg)] hover:bg-[var(--pvm-bg)] sm:inline-flex"
                href="/admin/settings"
              >
                Settings
              </Link>
              <Link
                className="rounded-md bg-[var(--pvm-fg)] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a3a5c]"
                href="/admin/redirects/new"
              >
                New redirect
              </Link>
              <UserButton />
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function NavIcon({ name }: { name: string }) {
  const common = "h-[15px] w-[15px] shrink-0";

  if (name === "grid") {
    return (
      <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
        <rect height="5" rx="1.2" width="5" x="1.5" y="1.5" />
        <rect height="5" rx="1.2" width="5" x="9.5" y="1.5" />
        <rect height="5" rx="1.2" width="5" x="1.5" y="9.5" />
        <rect height="5" rx="1.2" width="5" x="9.5" y="9.5" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v6M5 8h6" />
      </svg>
    );
  }

  if (name === "tag") {
    return (
      <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
        <path d="M2 2h5.5l6 6a1.5 1.5 0 0 1 0 2.1l-3.4 3.4a1.5 1.5 0 0 1-2.1 0l-6-6V2z" />
        <circle cx="5" cy="5" r="1" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="2.4" />
        <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" />
      </svg>
    );
  }

  return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
      <path d="M2 8h9m0 0-3-3m3 3-3 3" />
      <path d="M7 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4" />
    </svg>
  );
}
```

- [ ] **Step 4: Wire layout to shell**

Modify `src/app/admin/layout.tsx`:

```tsx
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
```

- [ ] **Step 5: Run layout test**

Run: `npm run test -- src/app/admin/layout.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AdminShell.tsx src/app/admin/layout.tsx src/app/admin/layout.test.tsx
git commit -m "feat: add prototype admin shell"
```

---

### Task 3: Persisted Category And Tag Catalog

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260513120000_add_redirect_taxonomy_catalog/migration.sql`
- Create: `src/lib/redirect-taxonomy.ts`
- Create: `src/lib/redirect-taxonomy.test.ts`
- Modify: `src/lib/redirect-service.ts`
- Modify: `src/lib/redirect-service.test.ts`

- [ ] **Step 1: Add failing tests for taxonomy helpers**

Create `src/lib/redirect-taxonomy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildTaxonomySummary,
  canDeleteTaxonomyItem,
  normalizeCatalogName,
} from "./redirect-taxonomy";

describe("redirect taxonomy", () => {
  it("normalizes catalog names without destroying display casing", () => {
    expect(normalizeCatalogName(" temporary ")).toBe("Temporary");
    expect(normalizeCatalogName("referalls")).toBe("Referrals");
    expect(normalizeCatalogName("fixed")).toBe("Fixed");
  });

  it("summarizes category and tag counts from redirects", () => {
    const summary = buildTaxonomySummary([
      { category: "Fixed", tags: ["packaging", "energy-bar"] },
      { category: "Fixed", tags: ["packaging"] },
      { category: "Temporary", tags: ["promo"] },
    ]);

    expect(summary.categories).toEqual([
      { name: "Fixed", count: 2 },
      { name: "Temporary", count: 1 },
    ]);
    expect(summary.tags).toEqual([
      { name: "packaging", count: 2 },
      { name: "energy-bar", count: 1 },
      { name: "promo", count: 1 },
    ]);
  });

  it("blocks delete while redirects still reference the item", () => {
    expect(canDeleteTaxonomyItem(0)).toEqual({ ok: true });
    expect(canDeleteTaxonomyItem(2)).toEqual({
      ok: false,
      message: "Cannot delete while 2 redirects still use it.",
    });
  });
});
```

- [ ] **Step 2: Run taxonomy tests and verify failure**

Run: `npm run test -- src/lib/redirect-taxonomy.test.ts`

Expected: FAIL because `src/lib/redirect-taxonomy.ts` does not exist.

- [ ] **Step 3: Add catalog schema and migration**

Modify `prisma/schema.prisma`:

```prisma
model RedirectCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  createdBy   String   @map("created_by")
  updatedBy   String   @map("updated_by")

  @@map("redirect_categories")
}

model RedirectTag {
  id        String   @id @default(cuid())
  slug      String   @unique
  label     String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  createdBy String   @map("created_by")
  updatedBy String   @map("updated_by")

  @@map("redirect_tags")
}
```

Create `prisma/migrations/20260513120000_add_redirect_taxonomy_catalog/migration.sql`:

```sql
CREATE TABLE "redirect_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" TEXT NOT NULL,
  "updated_by" TEXT NOT NULL,
  CONSTRAINT "redirect_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "redirect_categories_name_key" ON "redirect_categories"("name");

CREATE TABLE "redirect_tags" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" TEXT NOT NULL,
  "updated_by" TEXT NOT NULL,
  CONSTRAINT "redirect_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "redirect_tags_slug_key" ON "redirect_tags"("slug");
```

- [ ] **Step 4: Implement taxonomy helpers**

Create `src/lib/redirect-taxonomy.ts`:

```ts
import { DEFAULT_CATEGORIES, normalizeTag } from "./redirect-metadata";

const CATEGORY_ALIASES = new Map([
  ["referalls", "Referrals"],
  ["referrals", "Referrals"],
  ["referral", "Referrals"],
  ["fixed", "Fixed"],
  ["temporary", "Temporary"],
  ["general", "General"],
  ["promotion", "Promotion"],
  ["promotions", "Promotion"],
  ["internal", "Internal"],
]);

export type RedirectTaxonomySource = {
  category: string;
  tags: string[];
};

export type TaxonomyCount = {
  name: string;
  count: number;
};

export function normalizeCatalogName(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  const alias = CATEGORY_ALIASES.get(trimmed.toLowerCase());

  if (alias) {
    return alias;
  }

  return trimmed
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function buildTaxonomySummary(rows: RedirectTaxonomySource[]): {
  categories: TaxonomyCount[];
  tags: TaxonomyCount[];
} {
  const categoryCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();

  for (const defaultCategory of DEFAULT_CATEGORIES) {
    categoryCounts.set(defaultCategory, 0);
  }

  for (const row of rows) {
    const category = normalizeCatalogName(row.category || "General");
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);

    for (const tag of row.tags) {
      const normalized = normalizeTag(tag);
      if (normalized) {
        tagCounts.set(normalized, (tagCounts.get(normalized) ?? 0) + 1);
      }
    }
  }

  return {
    categories: [...categoryCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .filter((item) => item.count > 0 || DEFAULT_CATEGORIES.includes(item.name))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    tags: [...tagCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}

export function canDeleteTaxonomyItem(count: number):
  | { ok: true }
  | { ok: false; message: string } {
  if (count === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    message: `Cannot delete while ${count} redirects still use it.`,
  };
}
```

- [ ] **Step 5: Run taxonomy tests**

Run: `npm run test -- src/lib/redirect-taxonomy.test.ts`

Expected: PASS.

- [ ] **Step 6: Update redirect service tests for catalog upserts**

Modify `src/lib/redirect-service.test.ts` to extend the fake db with catalog methods and add assertions:

```ts
expect(db.redirectCategory.upsert).toHaveBeenCalledWith(
  expect.objectContaining({
    where: { name: "Fixed" },
  }),
);
expect(db.redirectTag.upsert).toHaveBeenCalledWith(
  expect.objectContaining({
    where: { slug: "energy-bar" },
  }),
);
```

- [ ] **Step 7: Run redirect service tests and verify failure**

Run: `npm run test -- src/lib/redirect-service.test.ts`

Expected: FAIL because `createRedirect` and `updateRedirect` do not upsert catalog rows yet.

- [ ] **Step 8: Implement catalog upsert support in redirect service**

Modify `RedirectDb` in `src/lib/redirect-service.ts` to include:

```ts
  redirectCategory?: {
    upsert(args: {
      where: { name: string };
      create: { name: string; createdBy: string; updatedBy: string };
      update: { updatedBy: string };
    }): Promise<unknown>;
  };
  redirectTag?: {
    upsert(args: {
      where: { slug: string };
      create: { slug: string; label: string; createdBy: string; updatedBy: string };
      update: { label: string; updatedBy: string };
    }): Promise<unknown>;
  };
```

Add helper:

```ts
async function upsertTaxonomyCatalog(
  db: RedirectDb,
  input: { category: string; tags: string[]; actorEmail: string },
): Promise<void> {
  await db.redirectCategory?.upsert({
    where: { name: input.category },
    create: {
      name: input.category,
      createdBy: input.actorEmail,
      updatedBy: input.actorEmail,
    },
    update: { updatedBy: input.actorEmail },
  });

  for (const tag of input.tags) {
    await db.redirectTag?.upsert({
      where: { slug: tag },
      create: {
        slug: tag,
        label: tag,
        createdBy: input.actorEmail,
        updatedBy: input.actorEmail,
      },
      update: {
        label: tag,
        updatedBy: input.actorEmail,
      },
    });
  }
}
```

Call it after successful redirect create/update:

```ts
await upsertTaxonomyCatalog(db, {
  category,
  tags,
  actorEmail: input.actorEmail,
});
```

Use local `category` and `tags` constants before the Prisma call so redirect data and catalog data stay identical.

- [ ] **Step 9: Run Prisma generate and service tests**

Run:

```bash
npm run prisma:generate
npm run test -- src/lib/redirect-taxonomy.test.ts src/lib/redirect-service.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260513120000_add_redirect_taxonomy_catalog/migration.sql src/lib/redirect-taxonomy.ts src/lib/redirect-taxonomy.test.ts src/lib/redirect-service.ts src/lib/redirect-service.test.ts
git commit -m "feat: add redirect taxonomy catalog"
```

---

### Task 4: Dashboard Aggregates And Page

**Files:**
- Create: `src/lib/admin-dashboard.ts`
- Create: `src/lib/admin-dashboard.test.ts`
- Create: `src/app/admin/dashboard/page.tsx`

- [ ] **Step 1: Write aggregate transform tests**

Create `src/lib/admin-dashboard.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildClickSeries, buildTopReferrers } from "./admin-dashboard";

describe("admin dashboard transforms", () => {
  it("builds a daily click series for the requested window", () => {
    const series = buildClickSeries(
      [
        { createdAt: new Date("2026-05-12T10:00:00.000Z") },
        { createdAt: new Date("2026-05-12T11:00:00.000Z") },
        { createdAt: new Date("2026-05-13T09:00:00.000Z") },
      ],
      new Date("2026-05-13T12:00:00.000Z"),
      3,
    );

    expect(series).toEqual([
      { label: "2026/05/11", count: 0 },
      { label: "2026/05/12", count: 2 },
      { label: "2026/05/13", count: 1 },
    ]);
  });

  it("groups missing referrers as direct traffic", () => {
    const referrers = buildTopReferrers([
      { referrerHost: null },
      { referrerHost: "instagram.com" },
      { referrerHost: "instagram.com" },
      { referrerHost: "google.com" },
    ]);

    expect(referrers).toEqual([
      { label: "instagram.com", count: 2, percentage: 50 },
      { label: "Direct / No referrer", count: 1, percentage: 25 },
      { label: "google.com", count: 1, percentage: 25 },
    ]);
  });
});
```

- [ ] **Step 2: Run dashboard transform tests and verify failure**

Run: `npm run test -- src/lib/admin-dashboard.test.ts`

Expected: FAIL because `src/lib/admin-dashboard.ts` does not exist.

- [ ] **Step 3: Implement dashboard transforms**

Create `src/lib/admin-dashboard.ts`:

```ts
export type ClickSeriesEvent = {
  createdAt: Date;
};

export type ReferrerEvent = {
  referrerHost: string | null;
};

export function buildClickSeries(
  events: ClickSeriesEvent[],
  now: Date,
  days: number,
): { label: string; count: number }[] {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    buckets.set(formatDate(date), 0);
  }

  for (const event of events) {
    const label = formatDate(event.createdAt);
    if (buckets.has(label)) {
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    }
  }

  return [...buckets.entries()].map(([label, count]) => ({ label, count }));
}

export function buildTopReferrers(
  events: ReferrerEvent[],
): { label: string; count: number; percentage: number }[] {
  const counts = new Map<string, number>();

  for (const event of events) {
    const label = event.referrerHost || "Direct / No referrer";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = events.length || 1;

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", { timeZone: "UTC" });
}
```

- [ ] **Step 4: Run dashboard transform tests**

Run: `npm run test -- src/lib/admin-dashboard.test.ts`

Expected: PASS.

- [ ] **Step 5: Create dashboard page from real data**

Create `src/app/admin/dashboard/page.tsx` with:
- `redirect.count()`
- `clickEvent.count()`
- recent `redirect.findMany({ take: 5, orderBy: { updatedAt: "desc" } })`
- recent `clickEvent.findMany({ take: 100, orderBy: { createdAt: "desc" } })`
- KPI cards for total redirects, total clicks, fixed/temporary category counts, and latest click
- recent activity list showing updated redirects and recent clicks
- top referrers progress list using `buildTopReferrers`

Use these imports:

```tsx
import Link from "next/link";
import { AdminCard, CardHeader, MetricCard, PageHeader, PrimaryLink, TagChip } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { buildTopReferrers } from "@/lib/admin-dashboard";
```

Set:

```ts
export const dynamic = "force-dynamic";
```

- [ ] **Step 6: Run route typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin-dashboard.ts src/lib/admin-dashboard.test.ts src/app/admin/dashboard/page.tsx
git commit -m "feat: add admin dashboard"
```

---

### Task 5: Branded Redirect List And Table

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/components/admin/RedirectTable.tsx`
- Modify: `src/components/admin/RedirectTable.test.tsx`

- [ ] **Step 1: Update table test for prototype columns**

Modify `src/components/admin/RedirectTable.test.tsx` so it asserts:

```tsx
expect(screen.getByRole("columnheader", { name: "SHORT URL" })).toBeInTheDocument();
expect(screen.getByRole("columnheader", { name: "TITLE / DESTINATION" })).toBeInTheDocument();
expect(screen.getByRole("columnheader", { name: "CATEGORY" })).toBeInTheDocument();
expect(screen.getByRole("columnheader", { name: "PURPOSE" })).toBeInTheDocument();
expect(screen.getByRole("columnheader", { name: "TAGS" })).toBeInTheDocument();
expect(screen.getByRole("link", { name: "https://go.pvm.co.za/care" })).toHaveAttribute(
  "href",
  "https://go.pvm.co.za/care",
);
expect(screen.getByRole("link", { name: "https://shop.pvm.co.za/care" })).toHaveAttribute(
  "href",
  "https://shop.pvm.co.za/care",
);
expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
  "href",
  "/admin/redirects/r1",
);
```

- [ ] **Step 2: Run table test and verify failure**

Run: `npm run test -- src/components/admin/RedirectTable.test.tsx`

Expected: FAIL until the prototype columns and badge/chip structure are implemented.

- [ ] **Step 3: Refactor table to prototype layout**

Modify `src/components/admin/RedirectTable.tsx`:
- Use `AdminCard`, `Badge`, `TagChip`, `UrlDisplay`.
- Header order: Short URL, Title / Destination, Category, Purpose, Tags, Clicks, Updated, blank edit column.
- Render title and destination together, with destination as a full clickable monospace link.
- Render category badge and purpose badge separately.
- Render tags as neutral chips.
- Keep `Edit` as inline text link.

- [ ] **Step 4: Refactor admin list page**

Modify `src/app/admin/page.tsx`:
- Use `PageHeader`, `PrimaryLink`, `AdminCard`, `MetricCard`.
- Add KPI strip above filters: total redirects from `redirects.length`, total clicks reduced from `_count`, category count, tag count.
- Replace the plain form card with prototype filter bar styling.
- Keep current query params: `q`, `category`, `purpose`, `tag`.
- Preserve reset link to `/admin`.

- [ ] **Step 5: Run table tests and typecheck**

Run:

```bash
npm run test -- src/components/admin/RedirectTable.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/page.tsx src/components/admin/RedirectTable.tsx src/components/admin/RedirectTable.test.tsx
git commit -m "feat: polish redirect list"
```

---

### Task 6: Prototype Create/Edit Form And Redirect Detail

**Files:**
- Modify: `src/components/admin/RedirectForm.tsx`
- Modify: `src/components/admin/RedirectForm.test.tsx`
- Modify: `src/app/admin/redirects/new/page.tsx`
- Modify: `src/app/admin/redirects/[id]/page.tsx`
- Modify: `src/components/admin/CopyButton.tsx`
- Create: `src/components/admin/CopyButton.test.tsx`

- [ ] **Step 1: Update form tests for preview and prototype sections**

Modify `src/components/admin/RedirectForm.test.tsx`:

```tsx
expect(screen.getByText("Redirect details")).toBeInTheDocument();
expect(screen.getByText("Short URL preview")).toBeInTheDocument();
expect(screen.getByText("QR Code")).toBeInTheDocument();
expect(screen.getByText("Coming soon")).toBeInTheDocument();
expect(screen.getByText("Active")).toBeInTheDocument();
expect(screen.getByLabelText("Code")).toHaveAttribute("placeholder", "Leave blank to auto-generate");
```

- [ ] **Step 2: Run form test and verify failure**

Run: `npm run test -- src/components/admin/RedirectForm.test.tsx`

Expected: FAIL until the new sections exist.

- [ ] **Step 3: Refactor `RedirectForm`**

Modify `src/components/admin/RedirectForm.tsx`:
- Accept new optional prop `shortUrlBase?: string`.
- Render a two-column layout at large widths:
  - left: main `Redirect details` card and `Admin metadata` card
  - right: `Status`, `Short URL preview`, and `QR Code` cards
- Keep `code` disabled in edit mode.
- Use monospace for code and destination.
- Keep form field names unchanged: `code`, `title`, `category`, `purpose`, `tags`, `destinationUrl`, `description`, `notes`.
- Render category options from `DEFAULT_CATEGORIES`, persisted suggestions, and current redirect category.
- Render purpose options from `REDIRECT_PURPOSES`.

- [ ] **Step 4: Update new redirect page**

Modify `src/app/admin/redirects/new/page.tsx`:
- Use `PageHeader`.
- Query catalog categories and redirect categories.
- Pass `shortUrlBase={`https://${env.PUBLIC_REDIRECT_HOST}`}` to `RedirectForm`.

- [ ] **Step 5: Update edit/detail page**

Modify `src/app/admin/redirects/[id]/page.tsx`:
- Use `PageHeader`, `Badge`, `TagChip`, `UrlDisplay`, `MetricCard`, `AdminCard`, `SecondaryAnchor`.
- Keep top actions: `Open destination`, `Test short URL`.
- Show summary cards: Short URL, Destination, Click activity.
- Show click detail table with columns: Referrer, Device / Browser, Result, Timestamp.
- Include existing event details: location chips, UTM chips, `ipHash` prefix, and full user agent in small muted text.
- Keep form action and `RedirectForm` usage.

- [ ] **Step 6: Run form tests and typecheck**

Create `src/components/admin/CopyButton.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  it("copies the configured value and shows copied state", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CopyButton value="https://go.pvm.co.za/ptn-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith("https://go.pvm.co.za/ptn-1");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run form and copy tests plus typecheck**

Run:

```bash
npm run test -- src/components/admin/RedirectForm.test.tsx src/components/admin/CopyButton.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/RedirectForm.tsx src/components/admin/RedirectForm.test.tsx src/app/admin/redirects/new/page.tsx 'src/app/admin/redirects/[id]/page.tsx' src/components/admin/CopyButton.tsx src/components/admin/CopyButton.test.tsx
git commit -m "feat: polish redirect editor"
```

---

### Task 7: Tags And Categories Management Page

**Files:**
- Create: `src/app/admin/tags/page.tsx`
- Create: `src/app/admin/tags/page.test.tsx`
- Modify: `src/app/admin/actions.ts`
- Modify: `src/lib/redirect-taxonomy.ts`
- Modify: `src/lib/redirect-taxonomy.test.ts`

- [ ] **Step 1: Add taxonomy action helper tests**

Extend `src/lib/redirect-taxonomy.test.ts` with:

```ts
import { normalizeTag } from "./redirect-metadata";

it("normalizes tag catalog values through the existing tag normalizer", () => {
  expect(normalizeTag(" Race 2026 ")).toBe("race-2026");
});
```

- [ ] **Step 2: Add server actions**

Modify `src/app/admin/actions.ts` to add:

```ts
export async function createCategoryAction(formData: FormData) {
  const actorEmail = await requireAdminEmail();
  const name = normalizeCatalogName(fieldValue(formData, "name"));

  await prisma.redirectCategory.upsert({
    where: { name },
    create: { name, createdBy: actorEmail, updatedBy: actorEmail },
    update: { updatedBy: actorEmail },
  });

  revalidatePath("/admin/tags");
}

export async function createTagAction(formData: FormData) {
  const actorEmail = await requireAdminEmail();
  const slug = normalizeTag(fieldValue(formData, "name"));

  if (!slug) {
    redirect("/admin/tags?error=Enter%20a%20tag%20name");
  }

  await prisma.redirectTag.upsert({
    where: { slug },
    create: { slug, label: slug, createdBy: actorEmail, updatedBy: actorEmail },
    update: { label: slug, updatedBy: actorEmail },
  });

  revalidatePath("/admin/tags");
}
```

Import:

```ts
import { normalizeTag } from "@/lib/redirect-metadata";
import { normalizeCatalogName } from "@/lib/redirect-taxonomy";
```

- [ ] **Step 3: Create page render test**

Create `src/app/admin/tags/page.test.tsx` with module mocks for Prisma and actions. Assert:

```tsx
expect(screen.getByRole("heading", { name: "Tags & Categories" })).toBeInTheDocument();
expect(screen.getByText("Purpose types")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Add category" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Add tag" })).toBeInTheDocument();
expect(screen.getByText("Fixed")).toBeInTheDocument();
expect(screen.getByText("packaging")).toBeInTheDocument();
```

- [ ] **Step 4: Run page test and verify failure**

Run: `npm run test -- src/app/admin/tags/page.test.tsx`

Expected: FAIL because the page does not exist.

- [ ] **Step 5: Implement `src/app/admin/tags/page.tsx`**

The page should:
- Query redirects for category/tag counts.
- Query catalog categories and tags.
- Merge catalog rows with redirect counts.
- Render two cards: Categories and Tags.
- Render add forms using `createCategoryAction` and `createTagAction`.
- Render purpose reference cards for `Print / QR`, `Campaign`, `Referral`, and `Event`.
- Use blocked delete copy as muted text until delete actions are added deliberately.

- [ ] **Step 6: Run tags page test and typecheck**

Run:

```bash
npm run test -- src/app/admin/tags/page.test.tsx src/lib/redirect-taxonomy.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/tags/page.tsx src/app/admin/tags/page.test.tsx src/app/admin/actions.ts src/lib/redirect-taxonomy.ts src/lib/redirect-taxonomy.test.ts
git commit -m "feat: add taxonomy management page"
```

---

### Task 8: Responsive Browser Verification And Production Readiness

**Files:**
- Modify only files needed to fix issues found during verification.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

Expected: all commands PASS.

- [ ] **Step 2: Apply database migration locally**

Run:

```bash
npm run prisma:migrate
```

Expected: migration applies and Prisma Client is generated.

- [ ] **Step 3: Start local dev server**

Run:

```bash
npm run dev -- --port 3003
```

Expected: Next.js serves the app at `http://localhost:3003`.

- [ ] **Step 4: Browser verify key routes**

Open and inspect:
- `http://localhost:3003/admin/dashboard`
- `http://localhost:3003/admin`
- `http://localhost:3003/admin/redirects/new`
- `http://localhost:3003/admin/redirects/<existing-id>`
- `http://localhost:3003/admin/tags`
- `http://localhost:3003/admin/settings`

Expected:
- No console errors.
- Yellow accent appears only as top stripe.
- URLs are fully visible or break cleanly without horizontal page overflow.
- Short URL and destination links are clickable.
- Form labels and button text fit on desktop and mobile widths.
- Tables scroll horizontally inside their card on narrow screens.

- [ ] **Step 5: Deploy migrations and app**

Run:

```bash
npm run prisma:deploy
vercel --prod --yes
```

Expected:
- Migration deploys against the linked production database.
- Vercel production deployment succeeds and keeps `admin.pvm.co.za` and `go.pvm.co.za` aliases.

- [ ] **Step 6: Production smoke test**

Verify:
- `https://admin.pvm.co.za/admin` loads after Clerk auth.
- `https://admin.pvm.co.za/admin/tags` shows real categories/tags.
- Existing `https://go.pvm.co.za/<code>` still redirects.
- A missing `go.pvm.co.za/<bad-code>` still uses configured fallback.

- [ ] **Step 7: Commit any verification fixes**

If verification required fixes, commit only those files:

```bash
git add <fixed-files>
git commit -m "fix: address admin prototype verification issues"
```

---

## Self-Review

**Spec coverage**
- Brand spec: Task 1 and Task 2 implement tokens, shell, stripe, typography, card/table rules.
- Prototype dashboard: Task 4 implements real dashboard data and visual pattern.
- Prototype redirect list: Task 5 implements filter bar, table, full URL links, badges, tags.
- Prototype create/edit: Task 6 implements form panels, URL preview, status card, QR coming-soon card.
- Prototype detail analytics: Task 6 implements summary cards and recent click table from real click events.
- Prototype tags/categories: Task 7 implements catalog view and add actions, while delete remains guarded by usage counts.
- Production safety: Task 8 covers tests, build, migration deploy, Vercel deploy, and smoke checks.

**Known intentional constraints**
- QR generation is not implemented because V1 explicitly keeps QR creation outside this app.
- Raw IP storage is not implemented; the current privacy-preserving `ipHash` remains the tracked value.
- Category/tag delete is guarded when in use to avoid silently changing live printed or campaign URLs.
