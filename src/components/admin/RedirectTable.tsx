import Link from "next/link";

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

export function RedirectTable({ rows, shortUrlBase }: RedirectTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
        <p className="font-medium text-slate-950">No redirects found.</p>
        <p className="mt-1">Create a redirect or adjust your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[1180px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            <th className="w-44 px-4 py-3">Category</th>
            <th className="w-72 px-4 py-3">Short URL</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Destination</th>
            <th className="w-20 px-4 py-3">Clicks</th>
            <th className="w-32 px-4 py-3">Updated</th>
            <th className="w-20 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr className="align-top hover:bg-slate-50" key={row.id}>
              <td className="px-4 py-4">
                <span className="inline-flex max-w-32 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  <span className="truncate">{row.category}</span>
                </span>
                <span className="mt-2 block text-xs font-medium text-slate-500">
                  {row.purpose}
                </span>
              </td>
              <td className="px-4 py-4 font-mono text-xs">
                <a
                  className="break-all text-slate-950 underline-offset-2 hover:underline"
                  href={`${shortUrlBase}/${row.code}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {shortUrlBase}/{row.code}
                </a>
              </td>
              <td className="px-4 py-4 font-medium text-slate-950">
                <span className="block">{row.title}</span>
                {row.tags.length > 0 ? (
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {row.tags.slice(0, 4).map((tag) => (
                      <span
                        className="rounded-full bg-[#00539b]/10 px-2 py-0.5 text-xs font-medium text-[#00539b]"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-4 font-mono text-xs">
                <a
                  className="break-all text-slate-700 underline-offset-2 hover:text-slate-950 hover:underline"
                  href={row.destinationUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {row.destinationUrl}
                </a>
              </td>
              <td className="px-4 py-4 tabular-nums">
                {row._count.clickEvents}
              </td>
              <td className="px-4 py-4 text-slate-600">
                {row.updatedAt.toLocaleDateString("en-ZA")}
              </td>
              <td className="px-4 py-4 text-right">
                <Link
                  className="font-medium text-slate-950 underline-offset-2 hover:underline"
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
  );
}
