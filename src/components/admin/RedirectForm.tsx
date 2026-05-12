type RedirectFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  redirect?: {
    code: string;
    destinationUrl: string;
    title: string;
    description: string | null;
    notes: string | null;
  };
};

export function RedirectForm({ action, error, redirect }: RedirectFormProps) {
  const isEdit = Boolean(redirect);

  return (
    <form action={action} className="space-y-5 rounded border bg-white p-6">
      {error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div>
        <label className="block text-sm font-medium" htmlFor="code">
          Code
        </label>
        <input
          aria-describedby="code-help"
          className="mt-1 w-full rounded border px-3 py-2 disabled:bg-slate-100 disabled:text-slate-600"
          defaultValue={redirect?.code ?? ""}
          disabled={isEdit}
          id="code"
          name="code"
        />
        <p className="mt-1 text-xs text-slate-500" id="code-help">
          {isEdit ? "Printed codes stay fixed." : "Leave blank to generate one."}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="title">
          Title
        </label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          defaultValue={redirect?.title ?? ""}
          id="title"
          name="title"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="destinationUrl">
          Destination URL
        </label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          defaultValue={redirect?.destinationUrl ?? ""}
          id="destinationUrl"
          name="destinationUrl"
          required
          type="url"
        />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="description">
          Description
        </label>
        <textarea
          className="mt-1 w-full rounded border px-3 py-2"
          defaultValue={redirect?.description ?? ""}
          id="description"
          name="description"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="notes">
          Notes
        </label>
        <textarea
          className="mt-1 w-full rounded border px-3 py-2"
          defaultValue={redirect?.notes ?? ""}
          id="notes"
          name="notes"
          rows={3}
        />
      </div>
      <button
        className="rounded bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        type="submit"
      >
        {isEdit ? "Save redirect" : "Create redirect"}
      </button>
    </form>
  );
}
