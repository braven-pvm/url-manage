import {
  cancelAdminInvitationAction,
  deleteAdminUserAction,
  saveAdminUserAction,
} from "@/app/admin/actions";
import { AccessInvitePanel } from "@/components/admin/AccessInvitePanel";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { FormPendingButton } from "@/components/admin/PendingButton";
import { AdminCard, Badge, CardHeader } from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-auth";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_LIMITS,
  ADMIN_ROLE_VALUES,
  ADMIN_ROLES,
  type AdminRoleName,
} from "@/lib/admin-roles";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = {
  accessDeleted?: string;
  accessSaved?: string;
  inviteCanceled?: string;
  inviteSent?: string;
  error?: string;
};

const roleTone: Record<AdminRoleName, "blue" | "grey" | "navy"> = {
  ADMINISTRATOR: "navy",
  EDITOR: "blue",
  VIEWER: "grey",
};

export default async function AdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const actor = await requireAdminRole("ADMINISTRATOR");
  const [params, adminUsers, pendingInvitations] = await Promise.all([
    searchParams,
    prisma.adminUser.findMany({
      orderBy: [{ role: "asc" }, { email: "asc" }],
      select: {
        createdBy: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
        updatedBy: true,
      },
    }),
    prisma.adminInvitation.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        createdBy: true,
        email: true,
        expiresAt: true,
        firstName: true,
        id: true,
        invitationUrl: true,
        lastName: true,
        role: true,
      },
    }),
  ]);
  const adminCount = adminUsers.filter((user) => user.role === "ADMINISTRATOR").length;

  return (
    <div className="space-y-6">
      <AccessInvitePanel
        accessDeleted={params.accessDeleted}
        accessSaved={params.accessSaved}
        error={params.error}
        inviteCanceled={params.inviteCanceled}
        inviteSent={params.inviteSent}
        showLastAdminWarning={adminCount <= 1}
      />

      <AdminCard>
        <CardHeader
          subtitle={`${adminUsers.length.toLocaleString("en-ZA")} ${
            adminUsers.length === 1 ? "user" : "users"
          }`}
          title="Active users"
        />
        <div className="divide-y divide-[var(--pvm-border)]">
          {adminUsers.map((adminUser) => {
            const isCurrentUser = adminUser.email === actor.email;
            const isLastAdministrator =
              adminUser.role === "ADMINISTRATOR" && adminCount <= 1;
            const locked = isCurrentUser || isLastAdministrator;

            return (
              <div
                className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,auto)] lg:items-center"
                data-testid={`access-user-${adminUser.email}`}
                key={adminUser.email}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#123253] text-sm font-bold text-white">
                    {initialsForAdminUser(adminUser)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-[var(--pvm-fg)]">
                        {displayNameForAdminUser(adminUser)}
                      </p>
                      {isCurrentUser ? <Badge>You</Badge> : null}
                    </div>
                    <p className="mt-0.5 font-mono text-[12px] text-[var(--pvm-fg)]">
                      {adminUser.email}
                    </p>
                    <p className="mt-1 text-[11.5px] text-[var(--pvm-muted)]">
                      Last changed by {adminUser.updatedBy || adminUser.createdBy} -{" "}
                      {adminUser.updatedAt.toLocaleDateString("en-ZA", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {locked ? (
                    <Badge tone={roleTone[adminUser.role]}>
                      {isLastAdministrator ? "Locked " : ""}
                      {ADMIN_ROLE_LABELS[adminUser.role]}
                    </Badge>
                  ) : (
                    <form action={saveAdminUserAction} className="flex items-center gap-2">
                      <input name="email" type="hidden" value={adminUser.email} />
                      <label className="sr-only" htmlFor={`role-${adminUser.email}`}>
                        Role for {adminUser.email}
                      </label>
                      <select
                        className="min-w-36 rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--pvm-teal)] focus:ring-2 focus:ring-blue-100"
                        defaultValue={adminUser.role}
                        id={`role-${adminUser.email}`}
                        name="role"
                      >
                        {ADMIN_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ADMIN_ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                      <FormPendingButton
                        ariaLabel={`Save role for ${adminUser.email}`}
                        className="rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--pvm-fg)] shadow-sm transition hover:border-[var(--pvm-fg)] disabled:opacity-70"
                        pendingText="Saving..."
                      >
                        Save
                      </FormPendingButton>
                    </form>
                  )}
                  <form action={deleteAdminUserAction.bind(null, adminUser.email)}>
                    <ConfirmSubmitButton
                      ariaLabel={`Remove ${adminUser.email}`}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                      confirmMessage={`Remove access for ${adminUser.email}?`}
                      disabled={locked}
                      pendingText="Removing..."
                    >
                      Remove
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>

      {pendingInvitations.length > 0 ? (
        <AdminCard>
          <CardHeader
            subtitle={`${pendingInvitations.length.toLocaleString("en-ZA")} pending`}
            title="Pending invites"
          />
          <div className="divide-y divide-[var(--pvm-border)]">
            {pendingInvitations.map((invitation) => (
              <div
                className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                key={invitation.id}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-[var(--pvm-muted)]">
                    {initialsForName(invitation.firstName, invitation.lastName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--pvm-fg)]">
                      {invitation.firstName} {invitation.lastName}
                    </p>
                    <p className="mt-0.5 font-mono text-[12px] text-[var(--pvm-fg)]">
                      {invitation.email}
                    </p>
                    <p className="mt-1 text-[11.5px] text-[var(--pvm-muted)]">
                      Invited as {ADMIN_ROLE_LABELS[invitation.role]} by{" "}
                      {invitation.createdBy} - expires{" "}
                      {invitation.expiresAt.toLocaleDateString("en-ZA", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Badge tone={roleTone[invitation.role]}>
                    {ADMIN_ROLE_LABELS[invitation.role]}
                  </Badge>
                  {invitation.invitationUrl ? (
                    <a
                      className="rounded-md px-3 py-2 text-sm font-semibold text-[var(--pvm-fg)] transition hover:bg-slate-100"
                      href={invitation.invitationUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open invite
                    </a>
                  ) : null}
                  <form action={cancelAdminInvitationAction.bind(null, invitation.id)}>
                    <ConfirmSubmitButton
                      ariaLabel={`Cancel invite for ${invitation.email}`}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-70"
                      confirmMessage={`Cancel invite for ${invitation.email}?`}
                      pendingText="Canceling..."
                    >
                      Cancel
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      ) : null}

      <AdminCard>
        <CardHeader
          actions={
            <p className="text-[11.5px] text-[var(--pvm-muted)]">
              What each access level can do
            </p>
          }
          title="Role capabilities"
        />
        <div className="grid gap-6 p-5 lg:grid-cols-3">
          {ADMIN_ROLES.map((role) => (
            <div key={role}>
              <div className="mb-3">
                <Badge tone={roleTone[role]}>{ADMIN_ROLE_LABELS[role]}</Badge>
              </div>
              <ul className="space-y-2 text-sm">
                {ADMIN_ROLE_VALUES[role].map((capability) => (
                  <li className="flex gap-2" key={capability}>
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--pvm-green)]" />
                    <span>{capability}</span>
                  </li>
                ))}
                {ADMIN_ROLE_LIMITS[role].map((limit) => (
                  <li className="flex gap-2 text-[var(--pvm-muted)]" key={limit}>
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

function displayNameForAdminUser(user: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return fullName || displayNameForEmail(user.email);
}

function displayNameForEmail(email: string) {
  return email.split("@")[0]?.replace(/[._-]+/g, " ") || email;
}

function initialsForAdminUser(user: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}) {
  if (user.firstName || user.lastName) {
    return initialsForName(user.firstName ?? "", user.lastName ?? "");
  }

  return initialsForEmail(user.email);
}

function initialsForEmail(email: string) {
  return displayNameForEmail(email)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function initialsForName(firstName: string, lastName: string) {
  return [firstName, lastName]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
