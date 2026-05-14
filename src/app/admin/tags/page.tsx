import {
  FormPendingButton,
} from "@/components/admin/PendingButton";
import { TaxonomyEditableRow } from "@/components/admin/TaxonomyEditableRow";
import {
  AdminCard,
  Badge,
  type BadgeTone,
  CardHeader,
  PageHeader,
  TagChip,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  buildTaxonomySummary,
  canDeleteTaxonomyItem,
  normalizeCatalogName,
  normalizeTag,
  type TaxonomyCount,
} from "@/lib/redirect-taxonomy";
import {
  createCategoryAction,
  createTagAction,
  deleteCategoryAction,
  deleteTagAction,
  renameCategoryAction,
  renameTagAction,
} from "../actions";

export const dynamic = "force-dynamic";

const purposeReferences = [
  {
    title: "Print / QR",
    tone: "blue",
    description:
      "For packaging, printed materials, and QR codes. The short code is locked once created - the destination can always be updated.",
  },
  {
    title: "Campaign",
    tone: "amber",
    description:
      "Short-lived URLs for promotions, product launches, or marketing campaigns. Can be paused or expired once the campaign ends.",
  },
  {
    title: "Referrals",
    tone: "green",
    description:
      "Tracks traffic from a specific source - influencer, partner, or affiliate. Each link is unique to one source for attribution.",
  },
  {
    title: "Event",
    tone: "purple",
    description:
      "Race expos, trade shows, demo days. Scoped to a single event. Typically expires automatically after the event date.",
  },
] satisfies { title: string; tone: BadgeTone; description: string }[];

const categoryDescriptions = new Map([
  ["General", "Uncategorised or miscellaneous"],
  ["Products", "Product pages and PDPs"],
  ["Fixed", "Printed packaging and permanent QR"],
  ["Temporary", "Short-term events and promotions"],
  ["Campaigns", "Promo and marketing campaigns"],
  ["Promotion", "Promo and marketing campaigns"],
  ["Events", "Race expos and trade shows"],
  ["Referrals", "Partner and affiliate links"],
  ["Partners", "Partner and affiliate links"],
]);

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
  type,
}: Readonly<{
  items: TaxonomyCount[];
  renderName: (name: string) => React.ReactNode;
  type: "category" | "tag";
}>) {
  return (
    <div className="divide-y divide-[var(--pvm-border)]">
      {items.map((item) => {
        const deleteCheck = canDeleteTaxonomyItem(item.count);
        const noun = type === "category" ? "category" : "tag";
        const renameAction =
          type === "category"
            ? renameCategoryAction.bind(null, item.name)
            : renameTagAction.bind(null, item.name);
        const deleteAction =
          type === "category"
            ? deleteCategoryAction.bind(null, item.name)
            : deleteTagAction.bind(null, item.name);
        const renameLabel = `Rename ${noun} ${item.name}`;
        const deleteLabel = `Delete ${noun} ${item.name}`;

        return (
          <TaxonomyEditableRow
            deleteAction={deleteAction}
            deleteDisabled={!deleteCheck.ok}
            deleteLabel={deleteLabel}
            deleteMessage={deleteCheck.ok ? undefined : deleteCheck.message}
            detail={`${formatNumber(item.count)} redirects${
              type === "category"
                ? ` - ${categoryDescriptions.get(item.name) ?? "Admin grouping"}`
                : ""
            }`}
            inputLabel={renameLabel}
            key={item.name}
            name={item.name}
            renameAction={renameAction}
          >
            {renderName(item.name)}
          </TaxonomyEditableRow>
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
      <FormPendingButton
        className="rounded-md bg-[var(--pvm-fg)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1a3a5c] disabled:opacity-70"
        pendingText="Adding..."
      >
        {buttonLabel}
      </FormPendingButton>
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
  await requireAdminRole("EDITOR");
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
            subtitle={`${formatNumber(categories.length)} total`}
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
            type="category"
          />
        </AdminCard>

        <AdminCard>
          <CardHeader
            subtitle={`${formatNumber(tags.length)} total`}
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
            type="tag"
          />
        </AdminCard>
      </div>

      <AdminCard>
        <CardHeader
          actions={
            <span className="text-xs text-[var(--pvm-muted)]">
              System-defined - not editable
            </span>
          }
          title="Purpose types"
        />
        <div className="grid gap-6 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          {purposeReferences.map((purpose) => (
            <div key={purpose.title}>
              <Badge tone={purpose.tone}>{purpose.title}</Badge>
              <p className="mt-2 max-w-[46ch] text-xs leading-5 text-[var(--pvm-muted)]">
                {purpose.description}
              </p>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
