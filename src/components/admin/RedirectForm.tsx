import {
  DEFAULT_CATEGORIES,
  REDIRECT_PURPOSES,
} from "@/lib/redirect-metadata";
import { AdminCard, Badge, CardHeader, UrlDisplay } from "./ui";

type RedirectFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
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
  cancelHref = "/admin",
  error,
  redirect,
  shortUrlBase = "https://go.pvm.co.za",
  suggestedCategories = [],
}: RedirectFormProps) {
  const isEdit = Boolean(redirect);
  const shortUrl =
    redirect?.code && shortUrlBase ? `${shortUrlBase}/${redirect.code}` : null;
  const categoryOptions = [
    ...new Set([
      ...DEFAULT_CATEGORIES,
      ...suggestedCategories,
      redirect?.category ?? "General",
    ]),
  ];
  const fieldClass =
    "mt-1.5 w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2.5 text-sm text-[var(--pvm-fg)] outline-none transition placeholder:text-[var(--pvm-muted)] focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-600";
  const labelClass =
    "text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]";

  return (
    <form
      action={action}
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
            title="Redirect details"
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
            <div>
              <label className={labelClass} htmlFor="description">
                Description
              </label>
              <textarea
                className={fieldClass}
                defaultValue={redirect?.description ?? ""}
                id="description"
                name="description"
                placeholder="What this printed URL is used for"
                rows={5}
              />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <CardHeader
            subtitle="Organize redirects for search, reporting, and campaign reviews."
            title="Admin metadata"
          />
          <div className="grid gap-5 p-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="category">
                  Category
                </label>
                <select
                  className={fieldClass}
                  defaultValue={redirect?.category ?? "General"}
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
            <div>
              <label className={labelClass} htmlFor="tags">
                Tags
              </label>
              <input
                className={fieldClass}
                defaultValue={redirect?.tags.join(", ") ?? ""}
                id="tags"
                name="tags"
                placeholder="energy-bar, qr, 2026-campaign"
              />
              <p className="mt-1 text-xs text-[var(--pvm-muted)]">
                Separate tags with commas. They are normalized for search.
              </p>
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

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <a
            className="text-sm font-semibold text-[var(--pvm-muted)] underline-offset-2 hover:text-[var(--pvm-fg)] hover:underline"
            href={cancelHref}
          >
            Cancel
          </a>
          <button
            className="rounded-md bg-[var(--pvm-fg)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a3a5c]"
            type="submit"
          >
            {isEdit ? "Save changes" : "Create redirect"}
          </button>
        </div>
      </div>

      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <AdminCard>
          <CardHeader title="Status" />
          <div className="p-5">
            <Badge tone="green">Active</Badge>
            <p className="mt-3 text-sm text-[var(--pvm-muted)]">
              Redirects remain active while their destination URL is valid.
            </p>
          </div>
        </AdminCard>

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
