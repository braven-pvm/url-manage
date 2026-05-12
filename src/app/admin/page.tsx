import Link from "next/link";
import { RedirectTable } from "@/components/admin/RedirectTable";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const redirects = await prisma.redirect.findMany({
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
      <RedirectTable rows={redirects} />
    </div>
  );
}
