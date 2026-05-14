"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { FormPendingButton } from "./PendingButton";

const secondaryButtonClass =
  "rounded-md border border-[var(--pvm-border)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--pvm-fg)] shadow-sm transition hover:border-[var(--pvm-fg)] disabled:opacity-70";

type TaxonomyEditableRowProps = Readonly<{
  children: ReactNode;
  deleteAction: () => void | Promise<void>;
  deleteDisabled?: boolean;
  deleteLabel: string;
  deleteMessage?: string;
  detail: string;
  inputLabel: string;
  name: string;
  renameAction: (formData: FormData) => void | Promise<void>;
}>;

export function TaxonomyEditableRow({
  children,
  deleteAction,
  deleteDisabled = false,
  deleteLabel,
  deleteMessage,
  detail,
  inputLabel,
  name,
  renameAction,
}: TaxonomyEditableRowProps) {
  const [editing, setEditing] = useState(false);
  const inputId = `rename-${inputLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="grid gap-3 px-5 py-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] lg:items-start">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[var(--pvm-fg)]">{children}</div>
        <p className="mt-1 text-xs text-[var(--pvm-muted)]">{detail}</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-end gap-2">
          {editing ? (
            <form action={renameAction} className="flex min-w-0 flex-1 items-center gap-2">
              <label className="sr-only" htmlFor={inputId}>
                {inputLabel}
              </label>
              <input
                autoFocus
                className="min-w-0 flex-1 rounded-md border border-[var(--pvm-border)] bg-white px-2.5 py-1.5 text-sm text-[var(--pvm-fg)] outline-none transition focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
                defaultValue={name}
                id={inputId}
                name="name"
                type="text"
              />
              <FormPendingButton className={secondaryButtonClass} pendingText="Saving...">
                Rename
              </FormPendingButton>
              <button
                className="rounded-md px-2 py-1.5 text-xs font-semibold text-[var(--pvm-muted)] transition hover:bg-slate-100 hover:text-[var(--pvm-fg)]"
                onClick={() => setEditing(false)}
                type="button"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              aria-label={inputLabel}
              className="rounded-md px-2 py-1.5 text-xs font-semibold text-[var(--pvm-muted)] transition hover:bg-slate-100 hover:text-[var(--pvm-fg)]"
              onClick={() => setEditing(true)}
              type="button"
            >
              Edit
            </button>
          )}

          <form action={deleteAction} className="shrink-0">
            <FormPendingButton
              ariaLabel={deleteLabel}
              className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={deleteDisabled}
              pendingText="Deleting..."
            >
              Delete
            </FormPendingButton>
          </form>
        </div>
        {deleteMessage ? (
          <p className="text-right text-[11px] text-[var(--pvm-muted)]">
            {deleteMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
