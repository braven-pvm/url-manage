import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AutoSubmitSelect } from "@/components/admin/AutoSubmitSelect";
import { RedirectTable } from "@/components/admin/RedirectTable";
import {
  AdminCard,
  PageHeader,
  PrimaryLink,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-auth";
import { hasAdminRole } from "@/lib/admin-roles";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  mergeCategorySuggestions,
  normalizeCategory,
  normalizeTag,
  REDIRECT_PURPOSES,
} from "@/lib/redirect-metadata";

export const dynamic = "force-dynamic";
const REDIRECT_LIST_LIMIT = 100;

function formatNumber(value: number) {
  return value.toLocaleString("en-ZA");
}

function filterHref(
  current: {
    category: string;
    purpose: string;
    q: string;
    status: string;
    tag: string;
  },
  next: Partial<{
    category: string;
    purpose: string;
    q: string;
    status: string;
    tag: string;
  }>,
) {
  const params = new URLSearchParams();
  const merged = { ...current, ...next };

  for (const [key, value] of Object.entries(merged)) {
    if (value) {
      params.set(key, value);
    }
  }

  const queryString = params.toString();
  return queryString ? `/redirects?${queryString}` : "/redirects";
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    purpose?: string;
    q?: string;
    status?: string;
    tag?: string;
  }>;
}) {
  const { category, purpose, q, status, tag } = await searchParams;
  const actor = await requireAdminRole("VIEWER");
  const canEdit = hasAdminRole(actor.role, "EDITOR");
  const query = q?.trim() ?? "";
  const categoryFilter = category?.trim() ? normalizeCategory(category) : "";
  const purposeFilter = purpose?.trim() ?? "";
  const statusFilter = status?.trim() === "active" ? "active" : "";
  const tagFilter = normalizeTag(tag ?? "");
  const queryTag = normalizeTag(query);
  const redirectWhere: Prisma.RedirectWhereInput = {
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(purposeFilter ? { purpose: purposeFilter } : {}),
    ...(tagFilter ? { tags: { has: tagFilter } } : {}),
    ...(query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { title: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
            { purpose: { contains: query, mode: "insensitive" } },
            { destinationUrl: { contains: query, mode: "insensitive" } },
            ...(queryTag ? [{ tags: { has: queryTag } }] : []),
          ],
        }
      : {}),
  };
  const [
    categories,
    catalogCategories,
    tagRows,
    redirectCount,
    filteredRedirectCount,
  ] = await Promise.all([
    prisma.redirect.findMany({
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
    prisma.redirectCategory.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    prisma.redirect.findMany({
      select: { tags: true },
    }),
    prisma.redirect.count(),
    prisma.redirect.count({ where: redirectWhere }),
  ]);
  const categoryOptions = mergeCategorySuggestions(
    [
      ...categories.map((item) => item.category),
      ...catalogCategories.map((item) => item.name),
    ],
  );
  const tagOptions = [...new Set(tagRows.flatMap((row) => row.tags))].sort();
  const redirects = await prisma.redirect.findMany({
    where: redirectWhere,
    orderBy: { updatedAt: "desc" },
    take: REDIRECT_LIST_LIMIT,
    include: { _count: { select: { clickEvents: true } } },
  });
  const clickCountsByCode = await getClickCountsByCode(
    redirects.map((redirect) => redirect.code),
  );
  const redirectsWithHistoricalCounts = redirects.map((redirect) => ({
    ...redirect,
    _count: {
      ...redirect._count,
      clickEvents:
        clickCountsByCode.get(redirect.code) ?? redirect._count.clickEvents,
    },
  }));
  const shortUrlBase = `https://${env.PUBLIC_REDIRECT_HOST}`;
  const capped = filteredRedirectCount > REDIRECT_LIST_LIMIT;
  const visibleRedirectCount = capped
    ? REDIRECT_LIST_LIMIT
    : filteredRedirectCount;
  const currentFilters = {
    category: categoryFilter,
    purpose: purposeFilter,
    q: query,
    status: statusFilter,
    tag: tagFilter,
  };
  const selectClass =
    "h-9 w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 text-sm text-[var(--pvm-fg)] outline-none transition focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100";

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          canEdit ? <PrimaryLink href="/redirects/new">New redirect</PrimaryLink> : null
        }
        description="Manage stable printed, QR, and campaign URLs."
        eyebrow="Admin Console"
        title="Redirects"
      />

      <AdminCard>
        <form
          action="/redirects"
          className="grid gap-3 border-b border-[var(--pvm-border)] p-4 lg:grid-cols-[minmax(220px,1fr)_160px_160px_150px_auto]"
        >
          {tagFilter ? <input name="tag" type="hidden" value={tagFilter} /> : null}
          <div className="relative">
            <label
              className="sr-only"
              htmlFor="redirect-search"
            >
              Search
            </label>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pvm-muted)]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="m21 21-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
            <input
              className="h-9 w-full rounded-md border border-[var(--pvm-border)] bg-white pl-9 pr-3 text-sm text-[var(--pvm-fg)] outline-none transition placeholder:text-[var(--pvm-muted)] focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
              defaultValue={query}
              id="redirect-search"
              name="q"
              placeholder="Code, title, tag, or destination..."
              type="search"
            />
          </div>
          <div>
            <label
              className="sr-only"
              htmlFor="category-filter"
            >
              Category
            </label>
            <AutoSubmitSelect
              className={selectClass}
              defaultValue={categoryFilter}
              id="category-filter"
              name="category"
            >
              <option value="">All categories</option>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </AutoSubmitSelect>
          </div>
          <div>
            <label
              className="sr-only"
              htmlFor="purpose-filter"
            >
              Purpose
            </label>
            <AutoSubmitSelect
              className={selectClass}
              defaultValue={purposeFilter}
              id="purpose-filter"
              name="purpose"
            >
              <option value="">All purposes</option>
              {REDIRECT_PURPOSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </AutoSubmitSelect>
          </div>
          <div>
            <label
              className="sr-only"
              htmlFor="status-filter"
            >
              Status
            </label>
            <AutoSubmitSelect
              className={selectClass}
              defaultValue={statusFilter}
              id="status-filter"
              name="status"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
            </AutoSubmitSelect>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              className="sr-only"
              type="submit"
            >
              Apply
            </button>
            <Link
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--pvm-muted)] transition hover:bg-slate-100 hover:text-[var(--pvm-fg)]"
              href="/redirects"
            >
              Reset
            </Link>
          </div>
        </form>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-xs">
          <span className="text-[var(--pvm-muted)]">Tags:</span>
          <Link
            className={`rounded-md px-2 py-1 font-semibold transition ${
              tagFilter
                ? "border border-[var(--pvm-border)] bg-[var(--pvm-bg)] text-[var(--pvm-muted)] hover:text-[var(--pvm-fg)]"
                : "bg-[var(--pvm-fg)] text-white"
            }`}
            href={filterHref(currentFilters, { tag: "" })}
          >
            All
          </Link>
          {tagOptions.map((item) => (
            <Link
              className={`rounded-md border px-2 py-1 font-medium transition ${
                tagFilter === item
                  ? "border-[var(--pvm-fg)] bg-[var(--pvm-fg)] text-white"
                  : "border-[var(--pvm-border)] bg-[var(--pvm-bg)] text-[var(--pvm-muted)] hover:text-[var(--pvm-fg)]"
              }`}
              href={filterHref(currentFilters, { tag: item })}
              key={item}
            >
              {item}
            </Link>
          ))}
        </div>
      </AdminCard>
      <RedirectTable
        footer={
          capped
            ? `Showing ${formatNumber(visibleRedirectCount)} of ${formatNumber(
                filteredRedirectCount,
              )} matching redirects`
            : `Showing ${formatNumber(visibleRedirectCount)} of ${formatNumber(
                redirectCount,
              )} redirects`
        }
        rows={redirectsWithHistoricalCounts}
        shortUrlBase={shortUrlBase}
        showEditAction={canEdit}
      />
    </div>
  );
}

async function getClickCountsByCode(codes: string[]) {
  if (codes.length === 0) {
    return new Map<string, number>();
  }

  const rows = await prisma.clickEvent.groupBy({
    by: ["requestedCode"],
    where: { requestedCode: { in: codes } },
    _count: { _all: true },
  });

  return new Map(rows.map((row) => [row.requestedCode, row._count._all]));
}
