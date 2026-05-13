import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/admin/CopyButton";
import { RedirectForm } from "@/components/admin/RedirectForm";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { mergeCategorySuggestions } from "@/lib/redirect-metadata";
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
  const [redirect, categories] = await Promise.all([
    prisma.redirect.findUnique({
      where: { id },
      include: {
        _count: { select: { clickEvents: true } },
        clickEvents: {
          orderBy: { createdAt: "desc" },
          take: 12,
        },
      },
    }),
    prisma.redirect.findMany({
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
  ]);

  if (!redirect) {
    notFound();
  }

  const action = updateRedirectAction.bind(null, redirect.id);
  const shortUrl = `https://${env.PUBLIC_REDIRECT_HOST}/${redirect.code}`;
  const destinationHost = getDestinationHost(redirect.destinationUrl);
  const lastClick = redirect.clickEvents[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link
            className="text-sm font-semibold text-slate-600 underline-offset-2 hover:text-slate-950 hover:underline"
            href="/admin"
          >
            Back to redirects
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#f6c900] px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-950">
              {redirect.category}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Stable code
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {redirect.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Edit the destination and admin metadata for this printed or QR URL.
            The public code remains fixed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:border-slate-950"
            href={redirect.destinationUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open destination
          </a>
          <a
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#00539b]"
            href={shortUrl}
            rel="noreferrer"
            target="_blank"
          >
            Test short URL
          </a>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <UrlCard label="Short URL" url={shortUrl} />
        <UrlCard label="Destination" meta={destinationHost} url={redirect.destinationUrl} />
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Click activity
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Metric label="Total" value={redirect._count.clickEvents.toString()} />
            <Metric
              label="Latest"
              value={lastClick ? lastClick.createdAt.toLocaleDateString("en-ZA") : "None"}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section>
          <RedirectForm
            action={action}
            error={query.error}
            redirect={redirect}
            suggestedCategories={mergeCategorySuggestions(
              categories.map((item) => item.category),
            )}
          />
        </section>
        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-950">
                Recent clicks
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Latest recorded redirect attempts for this code.
              </p>
            </div>
            {redirect.clickEvents.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {redirect.clickEvents.map((event) => (
                  <div className="px-5 py-4" key={event.id}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                        {event.outcome}
                      </span>
                      <time className="text-xs text-slate-500">
                        {event.createdAt.toLocaleString("en-ZA")}
                      </time>
                    </div>
                    <p className="mt-3 break-words text-sm text-slate-700">
                      {event.referrerHost ?? event.referrer ?? "No referrer"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-600">
                      {event.city || event.country ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {[event.city, event.country].filter(Boolean).join(", ")}
                        </span>
                      ) : null}
                      {event.region ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {event.region}
                        </span>
                      ) : null}
                      {event.timezone ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {event.timezone}
                        </span>
                      ) : null}
                      {event.utmCampaign ? (
                        <span className="rounded-full bg-[#00539b]/10 px-2 py-0.5 text-[#00539b]">
                          {event.utmCampaign}
                        </span>
                      ) : null}
                      {event.utmSource || event.utmMedium ? (
                        <span className="rounded-full bg-[#00539b]/10 px-2 py-0.5 text-[#00539b]">
                          {[event.utmSource, event.utmMedium]
                            .filter(Boolean)
                            .join(" / ")}
                        </span>
                      ) : null}
                      {event.ipHash ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono">
                          ip:{event.ipHash.slice(0, 10)}
                        </span>
                      ) : null}
                    </div>
                    {event.userAgent ? (
                      <p className="mt-1 line-clamp-2 break-words text-xs text-slate-500">
                        {event.userAgent}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-6 text-sm text-slate-600">
                No clicks recorded yet.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function UrlCard({
  label,
  meta,
  url,
}: {
  label: string;
  meta?: string;
  url: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <CopyButton value={url} />
      </div>
      <a
        className="mt-4 block break-all font-mono text-sm font-semibold text-slate-950 underline-offset-2 hover:underline"
        href={url}
        rel="noreferrer"
        target="_blank"
      >
        {url}
      </a>
      {meta ? <p className="mt-2 text-xs text-slate-500">{meta}</p> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}

function getDestinationHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "Invalid URL";
  }
}
