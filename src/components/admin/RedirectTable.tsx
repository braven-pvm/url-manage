import Link from "next/link";
import { AdminCard, Badge, TagChip, UrlDisplay, type BadgeTone } from "./ui";

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
  rows: RedirectTableRow[];
  shortUrlBase: string;
};

function badgeTone(value: string): BadgeTone {
  const normalized = value.toLowerCase();

  if (normalized === "fixed" || normalized === "print") {
    return "blue";
  }

  if (normalized === "temporary" || normalized === "promotion") {
    return "amber";
  }

  if (normalized === "referral") {
    return "green";
  }

  if (normalized === "event") {
    return "purple";
  }

  return "grey";
}

export function RedirectTable({ rows, shortUrlBase }: RedirectTableProps) {
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
        <table className="w-full min-w-[1260px] text-left text-sm">
        <thead className="border-b border-[var(--pvm-border)] bg-[var(--pvm-surface-2)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pvm-muted)]">
          <tr>
            <th className="w-72 px-4 py-3">SHORT URL</th>
            <th className="min-w-96 px-4 py-3">TITLE / DESTINATION</th>
            <th className="w-40 px-4 py-3">CATEGORY</th>
            <th className="w-48 px-4 py-3">PURPOSE</th>
            <th className="w-56 px-4 py-3">TAGS</th>
            <th className="w-24 px-4 py-3">CLICKS</th>
            <th className="w-32 px-4 py-3">UPDATED</th>
            <th className="w-20 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--pvm-border)]">
          {rows.map((row) => (
            <tr className="align-top transition hover:bg-[var(--pvm-surface-2)]" key={row.id}>
              <td className="px-4 py-4">
                <UrlDisplay href={`${shortUrlBase}/${row.code}`} />
              </td>
              <td className="px-4 py-4">
                <span className="block font-semibold text-[var(--pvm-fg)]">
                  {row.title}
                </span>
                <div className="mt-2">
                  <UrlDisplay href={row.destinationUrl} />
                </div>
              </td>
              <td className="px-4 py-4">
                <Badge tone={badgeTone(row.category)}>{row.category}</Badge>
              </td>
              <td className="px-4 py-4">
                <Badge tone={badgeTone(row.purpose)}>{row.purpose}</Badge>
              </td>
              <td className="px-4 py-4">
                {row.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
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
              <td className="px-4 py-4 text-[var(--pvm-muted)]">
                {row.updatedAt.toLocaleDateString("en-ZA")}
              </td>
              <td className="px-4 py-4 text-right">
                <Link
                  className="text-sm font-semibold text-[var(--pvm-teal)] underline-offset-2 hover:underline"
                  href={`/admin/redirects/${row.id}`}
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </AdminCard>
  );
}
