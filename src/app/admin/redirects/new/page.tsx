import { RedirectForm } from "@/components/admin/RedirectForm";
import { prisma } from "@/lib/prisma";
import { mergeCategorySuggestions } from "@/lib/redirect-metadata";
import { createRedirectAction } from "../../actions";

export default async function NewRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, categories] = await Promise.all([
    searchParams,
    prisma.redirect.findMany({
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New redirect</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create a stable public URL for packaging, QR codes, campaigns, or
          event material.
        </p>
      </div>
      <RedirectForm
        action={createRedirectAction}
        error={params.error}
        suggestedCategories={mergeCategorySuggestions(
          categories.map((item) => item.category),
        )}
      />
    </div>
  );
}
