import {
  AdminCard,
  CardHeader,
  PageHeader,
  TagChip,
} from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { REDIRECT_PURPOSES } from "@/lib/redirect-metadata";
import {
  buildTaxonomySummary,
  canDeleteTaxonomyItem,
  normalizeCatalogName,
  normalizeTag,
  type TaxonomyCount,
} from "@/lib/redirect-taxonomy";
import { createCategoryAction, createTagAction } from "../actions";

export const dynamic = "force-dynamic";

const purposeReferences = [
  {
    title: "Print / QR",
    description: "Permanent packaging, printed collateral, and QR placements.",
  },
  {
    title: "Campaign",
    description: "Time-bound promotions, offers, and campaign landing routes.",
  },
  {
    title: "Referral",
    description: "Partner, influencer, affiliate, or referral source tracking.",
  },
  {
    title: "Event",
    description: "Event signage, tasting stands, activations, and show material.",
  },
];

function formatNumber(value: number) {
  return value.toLocaleString("en-ZA");
}

function mergeCounts(
  counts: TaxonomyCount[],
  catalogNames: string[],
): TaxonomyCount[] {
  const merged = new Map(counts.map((item) => [item.name, item.count]));

  for (const name of catalogNames) {
    if (name) {
      merged.set(name, merged.get(name) ?? 0);
    }
  }

  return [...merged.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name),
    );
}

function TaxonomyRows({
  items,
  renderName,
}: Readonly<{
  items: TaxonomyCount[];
  renderName: (name: string) => React.ReactNode;
}>) {
  return (
    <div className="divide-y divide-[var(--pvm-border)]">
      {items.map((item) => {
        const deleteStatus = canDeleteTaxonomyItem(item.count);

        return (
          <div
            className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_90px_minmax(180px,auto)] sm:items-center"
            key={item.name}
          >
            <div className="min-w-0 text-sm font-medium text-[var(--pvm-fg)]">
              {renderName(item.name)}
            </div>
            <p className="text-xs tabular-nums text-[var(--pvm-muted)]">
              {formatNumber(item.count)} redirects
            </p>
            <p className="text-xs text-[var(--pvm-muted)]">
              {deleteStatus.ok ? "Unused. Delete controls are not enabled yet." : deleteStatus.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function AddTaxonomyForm({
  action,
  buttonLabel,
  inputId,
  placeholder,
}: Readonly<{
  action: (formData: FormData) => Promise<void>;
  buttonLabel: string;
  inputId: string;
  placeholder: string;
}>) {
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor={inputId}>
        {buttonLabel}
      </label>
      <input
        className="min-w-0 flex-1 rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm text-[var(--pvm-fg)] outline-none transition placeholder:text-[var(--pvm-muted)] focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
        id={inputId}
        name="name"
        placeholder={placeholder}
        type="text"
      />
      <button
        className="rounded-md bg-[var(--pvm-fg)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3a5c]"
        type="submit"
      >
        {buttonLabel}
      </button>
    </form>
  );
}

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
} = {}) {
  const resolvedSearchParams: Promise<{ error?: string }> =
    searchParams ?? Promise.resolve({});
  const [params, redirectRows, catalogCategories, catalogTags] = await Promise.all([
    resolvedSearchParams,
    prisma.redirect.findMany({
      select: {
        category: true,
        tags: true,
      },
    }),
    prisma.redirectCategory.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    prisma.redirectTag.findMany({
      orderBy: { slug: "asc" },
      select: {
        label: true,
        slug: true,
      },
    }),
  ]);
  const summary = buildTaxonomySummary(redirectRows);
  const categories = mergeCounts(
    summary.categories,
    catalogCategories.map((item) => normalizeCatalogName(item.name)),
  );
  const tags = mergeCounts(
    summary.tags,
    catalogTags.map((item) => normalizeTag(item.slug || item.label)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        description="Organise redirects for easier filtering and reporting."
        eyebrow="Organisation"
        title="Tags & Categories"
      />

      {params.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {params.error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard>
          <CardHeader
            subtitle="Catalog category names while redirects remain the source of truth."
            title="Categories"
          />
          <div className="border-b border-[var(--pvm-border)] px-5 py-4">
            <AddTaxonomyForm
              action={createCategoryAction}
              buttonLabel="Add category"
              inputId="category-name"
              placeholder="Category name"
            />
          </div>
          <TaxonomyRows
            items={categories}
            renderName={(name) => <span>{name}</span>}
          />
        </AdminCard>

        <AdminCard>
          <CardHeader
            subtitle="Catalog reusable tag slugs while redirect tags remain canonical."
            title="Tags"
          />
          <div className="border-b border-[var(--pvm-border)] px-5 py-4">
            <AddTaxonomyForm
              action={createTagAction}
              buttonLabel="Add tag"
              inputId="tag-name"
              placeholder="Tag name"
            />
          </div>
          <TaxonomyRows
            items={tags}
            renderName={(name) => <TagChip>{name}</TagChip>}
          />
        </AdminCard>
      </div>

      <AdminCard>
        <CardHeader
          subtitle={`Existing redirect purposes include ${REDIRECT_PURPOSES.length} configured values.`}
          title="Purpose types"
        />
        <div className="grid gap-3 px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
          {purposeReferences.map((purpose) => (
            <div
              className="rounded-md border border-[var(--pvm-border)] bg-[var(--pvm-bg)] p-4"
              key={purpose.title}
            >
              <h3 className="text-sm font-semibold text-[var(--pvm-fg)]">
                {purpose.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-[var(--pvm-muted)]">
                {purpose.description}
              </p>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
