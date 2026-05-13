import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { RedirectTable } from "@/components/admin/RedirectTable";
import {
  AdminCard,
  MetricCard,
  PageHeader,
  PrimaryLink,
} from "@/components/admin/ui";
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

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    purpose?: string;
    q?: string;
    tag?: string;
  }>;
}) {
  const { category, purpose, q, tag } = await searchParams;
  const query = q?.trim() ?? "";
  const categoryFilter = category?.trim() ? normalizeCategory(category) : "";
  const purposeFilter = purpose?.trim() ?? "";
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
    clickCount,
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
    prisma.clickEvent.count(),
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
  const shortUrlBase = `https://${env.PUBLIC_REDIRECT_HOST}`;
  const capped = filteredRedirectCount > REDIRECT_LIST_LIMIT;
  const visibleRedirectCount = capped
    ? REDIRECT_LIST_LIMIT
    : filteredRedirectCount;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={<PrimaryLink href="/admin/redirects/new">New redirect</PrimaryLink>}
        description="Manage stable printed and QR URLs."
        eyebrow="Admin Console"
        title="Redirects"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Redirects" value={formatNumber(redirectCount)} />
        <MetricCard label="Clicks" value={formatNumber(clickCount)} />
        <MetricCard label="Categories" value={formatNumber(categoryOptions.length)} />
        <MetricCard label="Tags" value={formatNumber(tagOptions.length)} />
      </div>

      <AdminCard className="p-5">
        <form
          action="/admin"
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_190px_180px_auto]"
        >
          <div>
            <label
              className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]"
              htmlFor="redirect-search"
            >
              Search
            </label>
            <input
              className="mt-1.5 w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm text-[var(--pvm-fg)] outline-none transition placeholder:text-[var(--pvm-muted)] focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
              defaultValue={query}
              id="redirect-search"
              name="q"
              placeholder="Code, title, category, or destination"
              type="search"
            />
          </div>
          <div>
            <label
              className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]"
              htmlFor="category-filter"
            >
              Category
            </label>
            <select
              className="mt-1.5 w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm text-[var(--pvm-fg)] outline-none transition focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
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
            </select>
          </div>
          <div>
            <label
              className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]"
              htmlFor="purpose-filter"
            >
              Purpose
            </label>
            <select
              className="mt-1.5 w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm text-[var(--pvm-fg)] outline-none transition focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
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
            </select>
          </div>
          <div>
            <label
              className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]"
              htmlFor="tag-filter"
            >
              Tag
            </label>
            <select
              className="mt-1.5 w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm text-[var(--pvm-fg)] outline-none transition focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
              defaultValue={tagFilter}
              id="tag-filter"
              name="tag"
            >
              <option value="">All tags</option>
              {tagOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              className="rounded-md bg-[var(--pvm-fg)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c]"
              type="submit"
            >
              Apply
            </button>
            <Link
              className="rounded-md px-3 py-2 text-sm font-semibold text-[var(--pvm-muted)] transition hover:text-[var(--pvm-fg)]"
              href="/admin"
            >
              Reset
            </Link>
          </div>
        </form>
      </AdminCard>
      <p className="text-sm text-[var(--pvm-muted)]">
        {capped
          ? `Showing ${formatNumber(visibleRedirectCount)} of ${formatNumber(
              filteredRedirectCount,
            )} matching redirects. Refine search or filters to find older records.`
          : `Showing ${formatNumber(visibleRedirectCount)} matching redirects.`}
      </p>
      <RedirectTable rows={redirects} shortUrlBase={shortUrlBase} />
    </div>
  );
}
