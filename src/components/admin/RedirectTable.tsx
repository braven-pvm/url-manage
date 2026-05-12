import Link from "next/link";

type RedirectTableRow = {
  id: string;
  code: string;
  title: string;
  destinationUrl: string;
  updatedAt: Date;
  _count: { clickEvents: number };
};

export function RedirectTable({ rows }: { rows: RedirectTableRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded border bg-white p-6 text-sm text-slate-600">
        No redirects yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase text-slate-600">
          <tr>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Destination</th>
            <th className="px-4 py-3">Clicks</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t" key={row.id}>
              <td className="px-4 py-3 font-medium">
                <Link
                  className="text-slate-950 underline-offset-2 hover:underline"
                  href={`/admin/redirects/${row.id}`}
                >
                  {row.code}
                </Link>
              </td>
              <td className="px-4 py-3">{row.title}</td>
              <td className="max-w-md truncate px-4 py-3 text-slate-600">
                {row.destinationUrl}
              </td>
              <td className="px-4 py-3">{row._count.clickEvents}</td>
              <td className="px-4 py-3">
                {row.updatedAt.toLocaleDateString("en-ZA")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
