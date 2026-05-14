import Link from "next/link";

import { PendingButton } from "@/components/admin/PendingButton";
import { RedirectForm } from "@/components/admin/RedirectForm";
import { requireAdminRole } from "@/lib/admin-auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { mergeCategorySuggestions } from "@/lib/redirect-metadata";
import { createRedirectAction } from "../../actions";

export default async function NewRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminRole("EDITOR");
  const [params, categories, catalogCategories] = await Promise.all([
    searchParams,
    prisma.redirect.findMany({
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
    prisma.redirectCategory.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            className="text-sm font-medium text-[var(--pvm-muted)] hover:text-[var(--pvm-fg)]"
            href="/redirects"
          >
            Back to redirects
          </Link>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pvm-muted)]">
            Redirects
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">New redirect</h1>
          <p className="mt-1 text-sm text-[var(--pvm-muted)]">
            Create a stable short URL. The code is permanent - the destination can
            always be updated.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            className="rounded-md border border-[var(--pvm-border)] bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:border-[var(--pvm-fg)]"
            href="/redirects"
          >
            Cancel
          </Link>
          <PendingButton
            className="rounded-md bg-[var(--pvm-fg)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a3a5c] disabled:opacity-70"
            form="redirect-form"
            pendingText="Saving..."
          >
            Save redirect
          </PendingButton>
        </div>
      </div>
      <RedirectForm
        action={createRedirectAction}
        error={params.error}
        shortUrlBase={`https://${env.PUBLIC_REDIRECT_HOST}`}
        suggestedCategories={mergeCategorySuggestions(
          [
            ...categories.map((item) => item.category),
            ...catalogCategories.map((item) => item.name),
          ],
        )}
      />
    </div>
  );
}
