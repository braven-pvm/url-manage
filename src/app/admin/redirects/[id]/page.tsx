import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { DeleteRedirectButton } from "@/components/admin/DeleteRedirectButton";
import { PendingButton } from "@/components/admin/PendingButton";
import { RedirectForm } from "@/components/admin/RedirectForm";
import {
  AdminCard,
  Badge,
  CardHeader,
  MetricCard,
  SecondaryAnchor,
  TagChip,
} from "@/components/admin/ui";
import { buildClickSeries, buildTopReferrers } from "@/lib/admin-dashboard";
import { requireAdminRole } from "@/lib/admin-auth";
import { hasAdminRole } from "@/lib/admin-roles";
import {
  formatClickCoordinates,
  formatClickLocation,
  formatClickTimezone,
  formatClickUtm,
} from "@/lib/click-display";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { mergeCategorySuggestions } from "@/lib/redirect-metadata";
import { deleteRedirectAction, updateRedirectAction } from "../../actions";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timestampFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function RedirectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; mode?: string; saved?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const actor = await requireAdminRole(query.mode === "edit" ? "EDITOR" : "VIEWER");
  const canEdit = hasAdminRole(actor.role, "EDITOR");
  const [redirect, categories, catalogCategories, tagRows, catalogTags] = await Promise.all([
    prisma.redirect.findUnique({
      where: { id },
    }),
    prisma.redirect.findMany({
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
    prisma.redirectCategory.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    prisma.redirect.findMany({
      select: { tags: true },
    }),
    prisma.redirectTag.findMany({
      orderBy: { slug: "asc" },
      select: { slug: true },
    }),
  ]);

  if (!redirect) {
    notFound();
  }

  const shortUrlBase = `https://${env.PUBLIC_REDIRECT_HOST}`;
  const shortUrl = `${shortUrlBase}/${redirect.code}`;
  const now = new Date();
  const clickSeriesStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 13),
  );
  const clickHistoryWhere = {
    OR: [
      { redirectId: redirect.id },
      { requestedCode: redirect.code },
      { redirectUrl: shortUrl },
    ],
  };
  const clickSeriesWhere = {
    AND: [
      clickHistoryWhere,
      { createdAt: { gte: clickSeriesStart } },
    ],
  };
  const [clickEvents, clickCount, clickSeriesEvents] = await Promise.all([
    prisma.clickEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      where: clickHistoryWhere,
    }),
    prisma.clickEvent.count({ where: clickHistoryWhere }),
    prisma.clickEvent.findMany({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
      where: clickSeriesWhere,
    }),
  ]);
  const hasHistoricalClicks = clickEvents.some(
    (event) => event.redirectId !== redirect.id,
  );
  const suggestedCategories = mergeCategorySuggestions([
    ...categories.map((item) => item.category),
    ...catalogCategories.map((item) => item.name),
  ]);
  const suggestedTags = [
    ...new Set([
      ...tagRows.flatMap((row) => row.tags),
      ...catalogTags.map((tag) => tag.slug),
      ...redirect.tags,
    ]),
  ].sort();

  if (query.mode === "edit") {
    return (
      <div className="space-y-6">
        <HeaderBlock
          actions={
            <>
              <DeleteRedirectButton
                action={deleteRedirectAction.bind(null, redirect.id)}
                title={redirect.title}
              />
              <Link
                className="rounded-md border border-[var(--pvm-border)] bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:border-[var(--pvm-fg)]"
                href={`/redirects/${redirect.id}`}
              >
                Cancel
              </Link>
              <PendingButton
                className="rounded-md bg-[var(--pvm-fg)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a3a5c] disabled:opacity-70"
                form="redirect-form"
                pendingText="Saving..."
              >
                Save redirect
              </PendingButton>
            </>
          }
          description="Update destination and admin metadata. The public code remains fixed."
          eyebrow="Redirects"
          title={`Edit ${redirect.title}`}
        />
        <RedirectForm
          action={updateRedirectAction.bind(null, redirect.id)}
          error={query.error}
          redirect={redirect}
          shortUrlBase={shortUrlBase}
          suggestedCategories={suggestedCategories}
          suggestedTags={suggestedTags}
        />
      </div>
    );
  }

  const latestClick = clickEvents[0];
  const topReferrers = buildTopReferrers(clickEvents);
  const clickSeries = buildClickSeries(clickSeriesEvents, now, 14);
  const maxSeriesCount = Math.max(...clickSeries.map((day) => day.count), 1);
  const clickSeriesTotal = clickSeries.reduce((sum, day) => sum + day.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            className="text-sm font-medium text-[var(--pvm-muted)] hover:text-[var(--pvm-fg)]"
            href="/redirects"
          >
            Back to redirects
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge tone={purposeTone(redirect.purpose)}>{purposeLabel(redirect.purpose)}</Badge>
            <Badge>{redirect.category}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">{redirect.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              className="rounded-md border border-[var(--pvm-border)] bg-white px-3 py-2 font-mono text-sm font-semibold text-[var(--pvm-teal)] shadow-sm hover:border-[var(--pvm-teal)] hover:underline"
              href={shortUrl}
              rel="noreferrer"
              target="_blank"
            >
              {env.PUBLIC_REDIRECT_HOST}/{redirect.code}
            </a>
            <SecondaryAnchor href={redirect.destinationUrl}>Open destination</SecondaryAnchor>
          </div>
          <p className="mt-3 font-mono text-sm text-[var(--pvm-teal)]">
            -&gt; {redirect.destinationUrl}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {redirect.tags.map((tag) => (
              <TagChip key={tag}>{tag}</TagChip>
            ))}
          </div>
          {query.saved === "1" ? (
            <p className="mt-4 inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              Redirect saved.
            </p>
          ) : null}
          {hasHistoricalClicks ? (
            <p className="mt-3 text-sm text-[var(--pvm-muted)]">
              Click totals include historical events recorded against this short
              code before this redirect record.
            </p>
          ) : null}
        </div>
        {canEdit ? (
          <Link
            className="rounded-md border border-[var(--pvm-border)] bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:border-[var(--pvm-fg)]"
            href={`/redirects/${redirect.id}?mode=edit`}
          >
            Edit redirect
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          detail="All recorded events for this short URL"
          label="Total Clicks"
          value={clickCount.toLocaleString("en-ZA")}
        />
        <MetricCard
          detail={latestClick ? latestClick.createdAt.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "No clicks yet"}
          label="Last Click"
          value={latestClick ? dateFormatter.format(latestClick.createdAt) : "-"}
        />
        <MetricCard
          detail={redirect.createdBy}
          label="Created"
          value={dateFormatter.format(redirect.createdAt)}
        />
        <MetricCard detail="Stable short code" label="Code" value={redirect.code} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)]">
        <AdminCard>
          <CardHeader
            actions={
              <span className="text-xs text-[var(--pvm-muted)]">
                Last 14 days
              </span>
            }
            subtitle={`Last 14 days - ${clickSeriesTotal.toLocaleString("en-ZA")} total`}
            title="Click activity"
          />
          <div className="px-5 py-5">
            <div className="flex h-48 items-end gap-2 border-b border-[var(--pvm-border)] pb-2">
              {clickSeries.map((day) => (
                <div
                  className="flex h-full flex-1 items-end"
                  key={day.label}
                  title={`${day.label}: ${day.count}`}
                >
                  <div
                    className={`w-full rounded-t-sm ${
                      day.count > 0 ? "bg-[var(--pvm-fg)]" : "bg-transparent"
                    }`}
                    style={{
                      height:
                        day.count > 0
                          ? `${Math.max(6, (day.count / maxSeriesCount) * 100)}%`
                          : "0%",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs tabular-nums text-[var(--pvm-muted)]">
              <span>{clickSeries[0]?.label}</span>
              <span>{clickSeries[Math.floor(clickSeries.length / 2)]?.label}</span>
              <span>{clickSeries.at(-1)?.label}</span>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <CardHeader
            actions={<span className="text-xs text-[var(--pvm-muted)]">Source of {clickCount.toLocaleString("en-ZA")} clicks</span>}
            title="Top referrers"
          />
          <div className="space-y-4 px-5 py-5">
            {topReferrers.length === 0 ? (
              <p className="text-sm text-[var(--pvm-muted)]">No referrers recorded yet.</p>
            ) : (
              topReferrers.slice(0, 5).map((referrer) => (
                <div key={referrer.label}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="font-semibold">{referrer.label}</span>
                    <span className="text-[var(--pvm-muted)]">
                      {referrer.count} - {referrer.percentage}%
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-[var(--pvm-fg)]" style={{ width: `${referrer.percentage}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminCard>
      </div>

      <AdminCard>
        <CardHeader
          actions={<span className="text-xs text-[var(--pvm-muted)]">Last 20 recorded events</span>}
          title="Recent clicks"
        />
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--pvm-border)] text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]">
            <tr>
              <th className="px-5 py-3">Referrer</th>
              <th className="px-5 py-3">Device / Browser</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Result</th>
              <th className="px-5 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--pvm-border)]">
            {clickEvents.map((event) => (
              <tr key={event.id}>
                <td className="px-5 py-3 font-mono text-xs text-[var(--pvm-muted)]">
                  {event.referrerHost?.trim() || "No referrer"}
                </td>
                <td className="px-5 py-3 text-[var(--pvm-muted)]">
                  {event.userAgent ? deviceLabel(event.userAgent) : "Unknown"}
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-[var(--pvm-fg)]">
                    {formatClickLocation(event)}
                  </p>
                  <ClickSecondaryDetails event={event} />
                </td>
                <td className="px-5 py-3">
                  <Badge tone={event.outcome === "matched" ? "green" : "amber"}>
                    {event.outcome}
                  </Badge>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-[var(--pvm-muted)]">
                  {timestampFormatter.format(event.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminCard>
    </div>
  );
}

function ClickSecondaryDetails({
  event,
}: Readonly<{
  event: {
    latitude: string | null;
    longitude: string | null;
    timezone: string | null;
    utmCampaign: string | null;
    utmMedium: string | null;
    utmSource: string | null;
  };
}>) {
  const secondary = [
    formatClickTimezone(event),
    formatClickCoordinates(event),
    formatClickUtm(event),
  ].filter((detail): detail is string => Boolean(detail));

  if (secondary.length === 0) {
    return (
      <p className="mt-1 text-xs text-[var(--pvm-muted)]">
        No geo enrichment captured
      </p>
    );
  }

  return (
    <div className="mt-1 space-y-0.5">
      {secondary.map((detail) => (
        <p className="font-mono text-[11px] text-[var(--pvm-muted)]" key={detail}>
          {detail}
        </p>
      ))}
    </div>
  );
}

function HeaderBlock({
  actions,
  description,
  eyebrow,
  title,
}: Readonly<{
  actions: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}>) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Link
          className="text-sm font-medium text-[var(--pvm-muted)] hover:text-[var(--pvm-fg)]"
          href="/redirects"
        >
          Back to redirects
        </Link>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pvm-muted)]">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-[var(--pvm-muted)]">{description}</p>
      </div>
      <div className="flex shrink-0 gap-2">{actions}</div>
    </div>
  );
}

function purposeTone(purpose: string) {
  const normalized = purpose.toLowerCase();

  if (normalized.includes("campaign") || normalized.includes("promotion")) {
    return "amber" as const;
  }

  if (normalized.includes("referral")) {
    return "green" as const;
  }

  if (normalized.includes("event")) {
    return "purple" as const;
  }

  return "blue" as const;
}

function purposeLabel(purpose: string) {
  return purpose.toLowerCase() === "product packaging" ? "Print / QR" : purpose;
}

function deviceLabel(userAgent: string) {
  if (userAgent.includes("Chrome")) {
    return "Chrome";
  }

  if (userAgent.includes("Safari")) {
    return "Safari";
  }

  if (userAgent.includes("Firefox")) {
    return "Firefox";
  }

  return "Captured user agent";
}
