import { FormPendingButton } from "./PendingButton";

type SettingsFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  fallbackUrl: string;
  shortLinkHost: string;
  error?: string;
};

export function SettingsForm({
  action,
  fallbackUrl,
  shortLinkHost,
  error,
}: SettingsFormProps) {
  return (
    <form action={action} className="space-y-0">
      {error ? (
        <p className="m-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      <div className="grid gap-3 border-b border-[var(--pvm-border)] px-5 py-5 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
        <div>
          <label className="text-sm font-semibold text-[var(--pvm-fg)]" htmlFor="fallbackUrl">
            Fallback URL
          </label>
          <p className="mt-1 text-[12px] text-[var(--pvm-muted)]" id="fallbackUrl-help">
            Where unknown or invalid short codes redirect.
          </p>
        </div>
        <input
          aria-describedby="fallbackUrl-help"
          className="w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 font-mono text-[12.5px] outline-none transition focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
          defaultValue={fallbackUrl}
          id="fallbackUrl"
          name="fallbackUrl"
          required
          type="url"
        />
      </div>
      <div className="grid gap-3 border-b border-[var(--pvm-border)] px-5 py-5 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
        <div>
          <p className="text-sm font-semibold text-[var(--pvm-fg)]">Short link domain</p>
          <p className="mt-1 text-[12px] text-[var(--pvm-muted)]">
            The base domain for generated short URLs. Update via deployment env.
          </p>
        </div>
        <div className="rounded-md border border-[var(--pvm-border)] bg-[var(--pvm-bg)] px-3 py-2 font-mono text-[12.5px] font-semibold text-[var(--pvm-teal)]">
          {shortLinkHost}
        </div>
      </div>
      <div className="grid gap-3 border-b border-[var(--pvm-border)] px-5 py-5 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
        <div>
          <p className="text-sm font-semibold text-[var(--pvm-fg)]">Redirect status</p>
          <p className="mt-1 text-[12px] text-[var(--pvm-muted)]">
            HTTP status code currently used when resolving redirects.
          </p>
        </div>
        <div className="rounded-md border border-[var(--pvm-border)] bg-[var(--pvm-bg)] px-3 py-2 text-sm text-[var(--pvm-fg)]">
          302 Temporary
        </div>
      </div>
      <div className="flex justify-end px-5 py-4">
        <FormPendingButton
          className="inline-flex min-h-9 items-center rounded-md bg-[var(--pvm-fg)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123253] disabled:opacity-70"
          pendingText="Saving..."
        >
          Save settings
        </FormPendingButton>
      </div>
    </form>
  );
}
