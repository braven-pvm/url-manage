type SettingsFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  fallbackUrl: string;
  error?: string;
};

export function SettingsForm({
  action,
  fallbackUrl,
  error,
}: SettingsFormProps) {
  return (
    <form action={action} className="space-y-5 rounded border bg-white p-6">
      {error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div>
        <label className="block text-sm font-medium" htmlFor="fallbackUrl">
          Fallback URL
        </label>
        <input
          aria-describedby="fallbackUrl-help"
          className="mt-1 w-full rounded border px-3 py-2"
          defaultValue={fallbackUrl}
          id="fallbackUrl"
          name="fallbackUrl"
          required
          type="url"
        />
        <p className="mt-1 text-xs text-slate-500" id="fallbackUrl-help">
          Unknown or invalid short URLs redirect here.
        </p>
      </div>
      <button
        className="rounded bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        type="submit"
      >
        Save fallback
      </button>
    </form>
  );
}
