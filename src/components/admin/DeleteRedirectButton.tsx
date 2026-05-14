"use client";

import { useFormStatus } from "react-dom";

type DeleteRedirectButtonProps = Readonly<{
  action: (formData: FormData) => void | Promise<void>;
  title: string;
}>;

export function DeleteRedirectButton({ action, title }: DeleteRedirectButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete "${title}"?\n\nThis removes the short URL. Existing click history is retained as historical data.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <DeleteSubmitButton />
    </form>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100 disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Deleting..." : "Delete redirect"}
    </button>
  );
}
