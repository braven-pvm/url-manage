import Link from "next/link";
import { AdminCard, Badge, TagChip, type BadgeTone } from "./ui";

type RedirectTableRow = {
  id: string;
  code: string;
  category: string;
  purpose: string;
  tags: string[];
  title: string;
  destinationUrl: string;
  updatedAt: Date;
  _count: { clickEvents: number };
};

type RedirectTableProps = {
  footer?: string;
  rows: RedirectTableRow[];
  showEditAction?: boolean;
  shortUrlBase: string;
};

function badgeTone(value: string): BadgeTone {
  const normalized = value.toLowerCase();

  if (
    normalized === "fixed" ||
    normalized === "print" ||
    normalized === "print / qr" ||
    normalized === "product packaging"
  ) {
    return "blue";
  }

  if (
    normalized === "temporary" ||
    normalized === "promotion" ||
    normalized === "campaign"
  ) {
    return "amber";
  }

  if (normalized === "referral" || normalized === "referrals") {
    return "green";
  }

  if (normalized === "event") {
    return "purple";
  }

  return "grey";
}

function displayUrl(href: string) {
  return href.replace(/^https?:\/\//, "");
}

function displayPurpose(purpose: string) {
  if (purpose.toLowerCase() === "product packaging") {
    return "Print / QR";
  }

  return purpose;
}

export function RedirectTable({
  footer,
  rows,
  showEditAction = true,
  shortUrlBase,
}: RedirectTableProps) {
  if (rows.length === 0) {
    return (
      <AdminCard className="p-8 text-sm text-[var(--pvm-muted)]">
        <p className="font-semibold text-[var(--pvm-fg)]">No redirects found.</p>
        <p className="mt-1">
          Create a redirect, broaden your search, or reset the current filters.
        </p>
      </AdminCard>
    );
  }

  return (
    <AdminCard>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1160px] text-left text-sm">
          <thead className="border-b border-[var(--pvm-border)] bg-[var(--pvm-surface-2)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pvm-muted)]">
            <tr>
              <th className="w-52 px-4 py-3">SHORT URL</th>
              <th className="min-w-72 px-4 py-3">TITLE / DESTINATION</th>
              <th className="w-32 px-4 py-3">CATEGORY</th>
              <th className="w-44 px-4 py-3">PURPOSE</th>
              <th className="w-48 px-4 py-3">TAGS</th>
              <th className="w-20 px-4 py-3">CLICKS</th>
              <th className="w-24 px-4 py-3">STATUS</th>
              <th className="w-28 px-4 py-3">UPDATED</th>
              <th className="w-24 px-6 py-3 pr-8">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
        <tbody className="divide-y divide-[var(--pvm-border)]">
          {rows.map((row) => (
            <tr className="align-top transition hover:bg-[var(--pvm-surface-2)]" key={row.id}>
              <td className="px-4 py-4">
                <a
                  className="whitespace-nowrap font-mono text-[12px] font-semibold leading-5 text-[var(--pvm-teal)] hover:underline"
                  href={`${shortUrlBase}/${row.code}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {displayUrl(`${shortUrlBase}/${row.code}`)}
                </a>
              </td>
              <td className="px-4 py-4">
                <Link
                  className="block font-semibold text-[var(--pvm-fg)] underline-offset-2 hover:text-[var(--pvm-teal)] hover:underline"
                  href={`/redirects/${row.id}`}
                >
                  {row.title}
                </Link>
                <a
                  className="mt-1 block break-all font-mono text-[12px] leading-5 text-[var(--pvm-muted)] hover:text-[var(--pvm-teal)] hover:underline"
                  href={row.destinationUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {displayUrl(row.destinationUrl)}
                </a>
              </td>
              <td className="px-4 py-4">
                <Badge tone={badgeTone(row.category)}>{row.category}</Badge>
              </td>
              <td className="px-4 py-4">
                <Badge tone={badgeTone(row.purpose)}>{displayPurpose(row.purpose)}</Badge>
              </td>
              <td className="px-4 py-4">
                {row.tags.length > 0 ? (
                  <div className="flex max-w-48 flex-wrap gap-1.5">
                    {row.tags.map((tag) => (
                      <TagChip key={tag}>{tag}</TagChip>
                    ))}
                  </div>
                ) : (
                  <span className="text-[12px] text-[var(--pvm-muted)]">None</span>
                )}
              </td>
              <td className="px-4 py-4 tabular-nums text-[var(--pvm-fg)]">
                {row._count.clickEvents}
              </td>
              <td className="px-4 py-4">
                <Badge tone="green">Active</Badge>
              </td>
              <td className="px-4 py-4 text-[var(--pvm-muted)]">
                {row.updatedAt.toLocaleDateString("en-ZA")}
              </td>
              <td className="px-6 py-4 pr-8 text-right">
                <Link
                  className="text-sm font-semibold text-[var(--pvm-teal)] underline-offset-2 hover:underline"
                  href={`/redirects/${row.id}`}
                >
                  {showEditAction ? "Edit" : "View"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {footer ? (
        <div className="border-t border-[var(--pvm-border)] px-4 py-3 text-sm text-[var(--pvm-muted)]">
          {footer}
        </div>
      ) : null}
    </AdminCard>
  );
}
