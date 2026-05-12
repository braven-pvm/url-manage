import Link from "next/link";
import { RedirectTable } from "@/components/admin/RedirectTable";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const redirects = await prisma.redirect.findMany({
    where: query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { title: { contains: query, mode: "insensitive" } },
            { destinationUrl: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { clickEvents: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Redirects</h1>
          <p className="mt-1 text-sm text-slate-600">
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
      <form action="/admin" className="flex max-w-xl gap-2">
        <label className="sr-only" htmlFor="redirect-search">
          Search redirects
        </label>
        <input
          className="min-w-0 flex-1 rounded border bg-white px-3 py-2 text-sm"
          defaultValue={query}
          id="redirect-search"
          name="q"
          placeholder="Search code, title, or destination"
          type="search"
        />
        <button
          className="rounded border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
          type="submit"
        >
          Search
        </button>
      </form>
      <RedirectTable rows={redirects} />
    </div>
  );
}
