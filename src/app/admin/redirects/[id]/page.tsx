import { notFound } from "next/navigation";
import { RedirectForm } from "@/components/admin/RedirectForm";
import { prisma } from "@/lib/prisma";
import { updateRedirectAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const redirect = await prisma.redirect.findUnique({
    where: { id },
    include: {
      clickEvents: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!redirect) {
    notFound();
  }

  const action = updateRedirectAction.bind(null, redirect.id);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Edit {redirect.code}</h1>
        <RedirectForm action={action} error={query.error} redirect={redirect} />
      </section>
      <aside className="rounded border bg-white p-5">
        <h2 className="text-sm font-semibold">Recent clicks</h2>
        {redirect.clickEvents.length > 0 ? (
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {redirect.clickEvents.map((event) => (
              <li
                className="border-b pb-3 last:border-b-0 last:pb-0"
                key={event.id}
              >
                <span className="block font-medium text-slate-950">
                  {event.outcome}
                </span>
                <span>{event.createdAt.toLocaleString("en-ZA")}</span>
                <span className="mt-1 block break-words text-xs">
                  {event.referrer ?? "No referrer"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-600">No clicks recorded yet.</p>
        )}
      </aside>
    </div>
  );
}
