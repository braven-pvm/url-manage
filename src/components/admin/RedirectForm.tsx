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
  suggestedTags?: string[];
};

export function RedirectForm({
  action,
  error,
  redirect,
  shortUrlBase = "https://go.pvm.co.za",
  suggestedCategories = [],
  suggestedTags = [],
}: RedirectFormProps) {
  const isEdit = Boolean(redirect);
  const shortUrl =
    redirect?.code && shortUrlBase ? `${shortUrlBase}/${redirect.code}` : null;
  const shortUrlPrefix = `${shortUrlBase.replace(/^https?:\/\//, "").replace(/\/$/, "")}/`;
  const selectedCategory = normalizeCategory(redirect?.category);
  const categoryOptions = mergeCategorySuggestions([
    ...suggestedCategories,
    selectedCategory,
  ]);
  const fieldClass =
    "mt-1.5 w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2.5 text-sm text-[var(--pvm-fg)] outline-none transition placeholder:text-[var(--pvm-muted)] focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-600";
  const labelClass =
    "text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--pvm-fg)]";

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
          <CardHeader title="Basic information" />
          <div className="grid gap-5 p-5">
            <div>
              <label className={labelClass} htmlFor="code">
                Short code <span className="font-normal normal-case tracking-normal text-[var(--pvm-muted)]">- permanent once created</span>
              </label>
              <div className="mt-1.5 flex overflow-hidden rounded-md border border-[var(--pvm-border)] bg-white transition focus-within:border-[var(--pvm-teal)] focus-within:ring-2 focus-within:ring-blue-100">
                <span className="inline-flex shrink-0 items-center border-r border-[var(--pvm-border)] bg-[var(--pvm-bg)] px-3 font-mono text-sm text-[var(--pvm-muted)]">
                  {shortUrlPrefix}
                </span>
                <input
                  className="min-w-0 flex-1 bg-white px-3 py-2.5 font-mono text-sm text-[var(--pvm-fg)] outline-none placeholder:text-[var(--pvm-muted)] disabled:bg-slate-100 disabled:text-slate-600"
                  defaultValue={redirect?.code ?? ""}
                  disabled={isEdit}
                  id="code"
                  name="code"
                  placeholder="e.g. oct-22, fusion-v2"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--pvm-muted)]">
                Lowercase, numbers, and hyphens only.
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
                placeholder="e.g. Fusion Meal Replacement - Packaging Q1 2025"
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="destinationUrl">
                Destination URL
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2.5 font-mono text-xs text-[var(--pvm-fg)] outline-none transition placeholder:text-[var(--pvm-muted)] focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
                  defaultValue={redirect?.destinationUrl ?? ""}
                  id="destinationUrl"
                  name="destinationUrl"
                  placeholder="https://pvm.co.za/product/..."
                  required
                  type="url"
                />
                <button
                  className="rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pvm-fg)] shadow-sm transition hover:border-[var(--pvm-fg)]"
                  type="button"
                >
                  Test
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--pvm-muted)]">
                The live URL this code redirects to.
              </p>
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
            <TagEditor
              defaultTags={redirect?.tags}
              helpText="Select common labels or type a custom tag and press Enter."
              label="Tags - select all that apply"
              name="tags"
              suggestedTags={suggestedTags}
            />
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
          <CardHeader title="Status" />
          <div className="flex items-center gap-3 p-5">
            <span
              aria-hidden="true"
              className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-[var(--pvm-fg)]"
            >
              <span className="absolute right-0.5 h-4 w-4 rounded-full bg-white shadow-sm" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--pvm-fg)]">Active</p>
              <p className="text-xs text-[var(--pvm-muted)]">
                Redirect is live and resolving
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <CardHeader title="Short URL preview" />
          <div className="p-5">
            {shortUrl ? (
              <UrlDisplay href={shortUrl} showCopy />
            ) : (
              <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-[var(--pvm-border)] bg-[var(--pvm-bg)] px-3 py-2 font-mono text-[12.5px]">
                <span className="text-[var(--pvm-muted)]">{shortUrlPrefix}</span>
                <span className="font-semibold text-[var(--pvm-muted)]">-</span>
                <span className="ml-auto rounded bg-white px-2 py-1 text-[11px] font-sans text-[var(--pvm-muted)]">
                  Copy
                </span>
              </div>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <CardHeader title="QR Code" />
          <div className="flex flex-col items-center gap-3 p-5">
            {redirect?.code ? (
              <>
                <img
                  alt="QR code preview"
                  className="w-full rounded-md border border-[var(--pvm-border)]"
                  src={`/api/qr/${redirect.code}?fg=%231a2b4a&bg=%23ffffff&dots=square&format=svg`}
                />
                <a
                  className="text-xs font-medium text-[var(--pvm-teal)] hover:underline"
                  download={`qr-${redirect.code}.svg`}
                  href={`/api/qr/${redirect.code}?fg=%231a2b4a&bg=%23ffffff&dots=square&format=svg&size=1000`}
                >
                  Download SVG
                </a>
              </>
            ) : (
              <>
                <div className="grid aspect-square w-28 place-items-center rounded-md border border-dashed border-[var(--pvm-border)] bg-white text-center text-xs font-medium leading-4 text-[var(--pvm-muted)]">
                  <div>
                    <QrStubIcon />
                    <span>Generated after saving</span>
                  </div>
                </div>
                <p className="text-center text-xs leading-5 text-[var(--pvm-muted)]">
                  Save the redirect first to lock the code.
                </p>
              </>
            )}
          </div>
        </AdminCard>
      </div>
    </form>
  );
}

function QrStubIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mx-auto mb-1 h-8 w-8 text-slate-400"
      fill="none"
      viewBox="0 0 16 16"
    >
      <rect height="5" rx="0.5" stroke="currentColor" width="5" x="1" y="1" />
      <rect height="5" rx="0.5" stroke="currentColor" width="5" x="10" y="1" />
      <rect height="5" rx="0.5" stroke="currentColor" width="5" x="1" y="10" />
      <rect fill="currentColor" height="2" width="2" x="2.5" y="2.5" />
      <rect fill="currentColor" height="2" width="2" x="11.5" y="2.5" />
      <rect fill="currentColor" height="2" width="2" x="2.5" y="11.5" />
    </svg>
  );
}
