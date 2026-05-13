import { RedirectForm } from "@/components/admin/RedirectForm";
import { PageHeader } from "@/components/admin/ui";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { mergeCategorySuggestions } from "@/lib/redirect-metadata";
import { createRedirectAction } from "../../actions";

export default async function NewRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
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
      <PageHeader
        description="Create a stable public URL for packaging, QR codes, campaigns, or event material."
        eyebrow="Redirects"
        title="New redirect"
      />
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
