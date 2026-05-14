import {
  mergeCategorySuggestions,
  normalizeCategory,
  REDIRECT_PURPOSES,
} from "@/lib/redirect-metadata";
import { TagEditor } from "./TagEditor";
import { AdminCard, CardHeader, UrlDisplay } from "./ui";

type RedirectFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  redirect?: {
    code: string;
    destinationUrl: string;
    title: string;
    category: string;
    purpose: string;
    tags: string[];
    description: string | null;
    notes: string | null;
  };
  shortUrlBase?: string;
  suggestedCategories?: string[];
};

export function RedirectForm({
  action,
  error,
  redirect,
  shortUrlBase = "https://go.pvm.co.za",
  suggestedCategories = [],
}: RedirectFormProps) {
  const isEdit = Boolean(redirect);
  const shortUrl =
    redirect?.code && shortUrlBase ? `${shortUrlBase}/${redirect.code}` : null;
  const selectedCategory = normalizeCategory(redirect?.category);
  const categoryOptions = mergeCategorySuggestions([
    ...suggestedCategories,
    selectedCategory,
  ]);
  const fieldClass =
    "mt-1.5 w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2.5 text-sm text-[var(--pvm-fg)] outline-none transition placeholder:text-[var(--pvm-muted)] focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-600";
  const labelClass =
    "text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]";

  return (
    <form
      action={action}
      id="redirect-form"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="space-y-6">
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        <AdminCard>
          <CardHeader
            subtitle="Keep printed codes stable and point them at the current destination."
            title="Basic information"
          />
          <div className="grid gap-5 p-5">
            <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <label className={labelClass} htmlFor="code">
                  Code
                </label>
                <input
                  aria-describedby="code-help"
                  className={`${fieldClass} font-mono`}
                  defaultValue={redirect?.code ?? ""}
                  disabled={isEdit}
                  id="code"
                  name="code"
                  placeholder="Leave blank to auto-generate"
                />
                <p className="mt-1 text-xs text-[var(--pvm-muted)]" id="code-help">
                  {isEdit
                    ? "Printed codes stay fixed once created."
                    : "Leave blank to auto-generate a compact code."}
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="title">
                  Title
                </label>
                <input
                  className={fieldClass}
                  defaultValue={redirect?.title ?? ""}
                  id="title"
                  name="title"
                  placeholder="Packaging, campaign, or QR purpose"
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="destinationUrl">
                Destination URL
              </label>
              <input
                className={`${fieldClass} font-mono text-xs`}
                defaultValue={redirect?.destinationUrl ?? ""}
                id="destinationUrl"
                name="destinationUrl"
                placeholder="https://pvm.co.za/product/..."
                required
                type="url"
              />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <CardHeader
            subtitle="Category, purpose, and tags"
            title="Classification"
          />
          <div className="grid gap-5 p-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="category">
                  Category
                </label>
                <select
                  className={fieldClass}
                  defaultValue={selectedCategory}
                  id="category"
                  name="category"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="purpose">
                  Purpose
                </label>
                <select
                  className={fieldClass}
                  defaultValue={redirect?.purpose ?? "General"}
                  id="purpose"
                  name="purpose"
                >
                  {REDIRECT_PURPOSES.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <TagEditor defaultTags={redirect?.tags} name="tags" />
          </div>
        </AdminCard>

        <AdminCard>
          <CardHeader
            subtitle="Optional - not shown publicly"
            title="Notes & metadata"
          />
          <div className="grid gap-5 p-5">
            <div>
              <label className={labelClass} htmlFor="description">
                Description
              </label>
              <textarea
                className={fieldClass}
                defaultValue={redirect?.description ?? ""}
                id="description"
                name="description"
                placeholder="What this printed URL is used for, which product, campaign brief..."
                rows={4}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="notes">
                Internal notes
              </label>
              <textarea
                className={fieldClass}
                defaultValue={redirect?.notes ?? ""}
                id="notes"
                name="notes"
                placeholder="Packaging batch, campaign owner, expiry notes..."
                rows={5}
              />
            </div>
          </div>
        </AdminCard>

      </div>

      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <AdminCard>
          <CardHeader title="Short URL preview" />
          <div className="p-5">
            {shortUrl ? (
              <UrlDisplay href={shortUrl} showCopy />
            ) : (
              <p className="font-mono text-sm text-[var(--pvm-muted)]">
                {shortUrlBase}/auto-generated
              </p>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <CardHeader title="QR Code" />
          <div className="p-5">
            <div className="grid aspect-square place-items-center rounded-md border border-dashed border-[var(--pvm-border)] bg-[var(--pvm-bg)] text-sm font-semibold text-[var(--pvm-muted)]">
              Coming soon
            </div>
          </div>
        </AdminCard>
      </div>
    </form>
  );
}
