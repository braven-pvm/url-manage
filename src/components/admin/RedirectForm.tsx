type RedirectFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  error?: string;
  redirect?: {
    code: string;
    destinationUrl: string;
    title: string;
    category: string;
    description: string | null;
    notes: string | null;
  };
  suggestedCategories?: string[];
};

export function RedirectForm({
  action,
  cancelHref = "/admin",
  error,
  redirect,
  suggestedCategories = [],
}: RedirectFormProps) {
  const isEdit = Boolean(redirect);
  const categoryListId = `category-options-${redirect?.code ?? "new"}`;
  const fieldClass =
    "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#00539b] focus:ring-2 focus:ring-[#00539b]/15 disabled:bg-slate-100 disabled:text-slate-600";

  return (
    <form
      action={action}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      {error ? (
        <p className="m-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-950">
          Redirect details
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Keep printed codes stable and point them at the current destination.
        </p>
      </div>
      <div className="grid gap-5 p-5">
        <div>
          <label className="block text-sm font-semibold text-slate-800" htmlFor="code">
            Code
          </label>
          <input
            aria-describedby="code-help"
            className={fieldClass}
            defaultValue={redirect?.code ?? ""}
            disabled={isEdit}
            id="code"
            name="code"
          />
          <p className="mt-1 text-xs text-slate-500" id="code-help">
            {isEdit
              ? "Printed codes stay fixed once created."
              : "Leave blank to generate a compact code."}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <label className="block text-sm font-semibold text-slate-800" htmlFor="title">
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
          <div>
            <label
              className="block text-sm font-semibold text-slate-800"
              htmlFor="category"
            >
              Category
            </label>
            <input
              className={fieldClass}
              defaultValue={redirect?.category ?? "General"}
              id="category"
              list={categoryListId}
              name="category"
              placeholder="Product, Promo, Event"
            />
            {suggestedCategories.length > 0 ? (
              <datalist id={categoryListId}>
                {suggestedCategories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            ) : null}
          </div>
        </div>
        <div>
          <label
            className="block text-sm font-semibold text-slate-800"
            htmlFor="destinationUrl"
          >
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
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              className="block text-sm font-semibold text-slate-800"
              htmlFor="description"
            >
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
          <div>
            <label className="block text-sm font-semibold text-slate-800" htmlFor="notes">
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
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <a
          className="text-sm font-semibold text-slate-600 underline-offset-2 hover:text-slate-950 hover:underline"
          href={cancelHref}
        >
          Cancel
        </a>
        <button
          className="rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00539b]"
          type="submit"
        >
          {isEdit ? "Save changes" : "Create redirect"}
        </button>
      </div>
    </form>
  );
}
