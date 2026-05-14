"use client";

import { useState } from "react";

import { sendAdminInvitationAction } from "@/app/admin/actions";
import { ADMIN_ROLE_LABELS, ADMIN_ROLES } from "@/lib/admin-roles";
import { FormPendingButton } from "./PendingButton";
import { AdminCard, CardHeader, PageHeader } from "./ui";

type AccessInvitePanelProps = Readonly<{
  accessDeleted?: string;
  accessSaved?: string;
  inviteCanceled?: string;
  inviteSent?: string;
  error?: string;
  showLastAdminWarning: boolean;
}>;

export function AccessInvitePanel({
  accessDeleted,
  accessSaved,
  error,
  inviteCanceled,
  inviteSent,
  showLastAdminWarning,
}: AccessInvitePanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        actions={
          <button
            className="inline-flex items-center rounded-md bg-[var(--pvm-fg)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123253]"
            onClick={() => setOpen(true)}
            type="button"
          >
            + Invite user
          </button>
        }
        description="Control who can access PVM URL Admin and what they can do."
        eyebrow="System"
        title="Access Management"
      />

      {showLastAdminWarning ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          You are the only Administrator. Promote another user to Administrator
          before you remove your own access.
        </div>
      ) : null}
      <StatusMessages
        accessDeleted={accessDeleted}
        accessSaved={accessSaved}
        error={error}
        inviteCanceled={inviteCanceled}
        inviteSent={inviteSent}
      />

      {open ? (
        <AdminCard>
          <CardHeader
            actions={
              <button
                aria-label="Close invite user panel"
                className="rounded-md px-2 py-1 text-lg leading-none text-[var(--pvm-muted)] transition hover:bg-slate-100 hover:text-[var(--pvm-fg)]"
                onClick={() => setOpen(false)}
                type="button"
              >
                x
              </button>
            }
            subtitle="An email invitation will be sent - expires in 7 days."
            title="Invite a new user"
          />
          <div className="p-5">
            <form
              action={sendAdminInvitationAction}
              className="grid gap-3 lg:grid-cols-[minmax(150px,0.7fr)_minmax(150px,0.7fr)_minmax(260px,1.4fr)_190px_auto]"
            >
              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]"
                  htmlFor="access-first-name"
                >
                  Name
                </label>
                <input
                  className="w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
                  id="access-first-name"
                  name="firstName"
                  placeholder="First name"
                  required
                  type="text"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]"
                  htmlFor="access-last-name"
                >
                  Surname
                </label>
                <input
                  className="w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
                  id="access-last-name"
                  name="lastName"
                  placeholder="Surname"
                  required
                  type="text"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]"
                  htmlFor="access-email"
                >
                  Email address
                </label>
                <input
                  className="w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
                  id="access-email"
                  name="email"
                  placeholder="name@domain.com"
                  required
                  type="email"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]"
                  htmlFor="access-role"
                >
                  Role
                </label>
                <select
                  className="w-full rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
                  defaultValue="EDITOR"
                  id="access-role"
                  name="role"
                >
                  {ADMIN_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ADMIN_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <FormPendingButton
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-[var(--pvm-fg)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123253] disabled:opacity-70 lg:w-auto"
                  pendingText="Sending..."
                >
                  Send invite
                </FormPendingButton>
              </div>
            </form>
          </div>
        </AdminCard>
      ) : null}
    </>
  );
}

function StatusMessages({
  accessDeleted,
  accessSaved,
  error,
  inviteCanceled,
  inviteSent,
}: Readonly<{
  accessDeleted?: string;
  accessSaved?: string;
  error?: string;
  inviteCanceled?: string;
  inviteSent?: string;
}>) {
  if (error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {error}
      </p>
    );
  }

  if (accessSaved) {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        Access updated.
      </p>
    );
  }

  if (accessDeleted) {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        Access removed.
      </p>
    );
  }

  if (inviteSent) {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        Invite sent.
      </p>
    );
  }

  if (inviteCanceled) {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        Invite canceled.
      </p>
    );
  }

  return null;
}
