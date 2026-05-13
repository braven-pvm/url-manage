import Link from "next/link";
import { RedirectTable } from "@/components/admin/RedirectTable";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  mergeCategorySuggestions,
  normalizeTag,
  REDIRECT_PURPOSES,
} from "@/lib/redirect-metadata";

export const dynamic = "force-dynamic";

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; purpose?: string; q?: string; tag?: string }>;
}) {
  const { category, purpose, q, tag } = await searchParams;
  const query = q?.trim() ?? "";
  const categoryFilter = category?.trim() ?? "";
  const purposeFilter = purpose?.trim() ?? "";
  const tagFilter = normalizeTag(tag ?? "");
  const [categories, tagRows] = await Promise.all([
    prisma.redirect.findMany({
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
    prisma.redirect.findMany({
      select: { tags: true },
    }),
  ]);
  const categoryOptions = mergeCategorySuggestions(
    categories.map((item) => item.category),
  );
  const tagOptions = [...new Set(tagRows.flatMap((row) => row.tags))].sort();
  const queryTag = normalizeTag(query);
  const redirects = await prisma.redirect.findMany({
    where: {
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
    },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { clickEvents: true } } },
  });
  const shortUrlBase = `https://${env.PUBLIC_REDIRECT_HOST}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Admin console
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Redirects
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage stable printed and QR URLs.
          </p>
        </div>
        <Link
          className="rounded bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          href="/admin/redirects/new"
        >
          New redirect
        </Link>
      </div>
      <form
        action="/admin"
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_180px_190px_180px_auto]"
      >
        <div>
          <label className="text-xs font-medium text-slate-600" htmlFor="redirect-search">
            Search
          </label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            defaultValue={query}
            id="redirect-search"
            name="q"
            placeholder="Code, title, category, or destination"
            type="search"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600" htmlFor="category-filter">
            Category
          </label>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
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
          <label className="text-xs font-medium text-slate-600" htmlFor="purpose-filter">
            Purpose
          </label>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
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
          <label className="text-xs font-medium text-slate-600" htmlFor="tag-filter">
            Tag
          </label>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
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
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
            type="submit"
          >
            Apply
          </button>
          <Link
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-950"
            href="/admin"
          >
            Reset
          </Link>
        </div>
      </form>
      <RedirectTable rows={redirects} shortUrlBase={shortUrlBase} />
    </div>
  );
}
