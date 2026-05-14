import Link from "next/link";

import {
  AdminCard,
  Badge,
  type BadgeTone,
  CardHeader,
  PageHeader,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-auth";
import {
  formatClickLocation,
  formatClickTimezone,
  formatClickUtm,
} from "@/lib/click-display";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatNumber(value: number) {
  return value.toLocaleString("en-ZA");
}

function purposeTone(purpose: string) {
  const normalized = purpose.toLowerCase();

  if (normalized.includes("campaign")) {
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

const toneFillClass: Record<BadgeTone, string> = {
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  grey: "bg-slate-400",
  navy: "bg-slate-700",
  purple: "bg-violet-500",
  red: "bg-red-500",
};

const toneSoftClass: Record<BadgeTone, string> = {
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  grey: "bg-slate-100 text-slate-600",
  navy: "bg-slate-100 text-[var(--pvm-fg)]",
  purple: "bg-violet-50 text-violet-700",
  red: "bg-red-50 text-red-700",
};

function outcomeTone(outcome: string): BadgeTone {
  return outcome === "matched" ? "green" : "amber";
}

function purposeLabel(purpose: string) {
  return purpose.toLowerCase() === "product packaging" ? "Print / QR" : purpose;
}

export default async function AdminDashboardPage() {
  await requireAdminRole("VIEWER");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    redirectCount,
    clickCount,
    todayClickCount,
    fallbackClickCount,
    redirectRows,
    recentClicks,
  ] = await Promise.all([
    prisma.redirect.count(),
    prisma.clickEvent.count(),
    prisma.clickEvent.count({ where: { createdAt: { gte: today } } }),
    prisma.clickEvent.count({ where: { outcome: "fallback" } }),
    prisma.redirect.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        _count: { select: { clickEvents: true } },
        code: true,
        id: true,
        purpose: true,
        title: true,
      },
      take: 100,
    }),
    prisma.clickEvent.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        city: true,
        country: true,
        latitude: true,
        longitude: true,
        outcome: true,
        redirect: { select: { code: true, title: true } },
        redirectUrl: true,
        referrerHost: true,
        region: true,
        requestedCode: true,
        timezone: true,
        utmCampaign: true,
        utmMedium: true,
        utmSource: true,
      },
      take: 100,
    }),
  ]);

  const shortUrlBase = env.PUBLIC_REDIRECT_HOST;
  const clickCountsByCode = await getClickCountsByCode(
    redirectRows.map((redirect) => redirect.code),
  );
  const redirectsWithHistoricalCounts = redirectRows.map((redirect) => ({
    ...redirect,
    _count: {
      ...redirect._count,
      clickEvents:
        clickCountsByCode.get(redirect.code) ?? redirect._count.clickEvents,
    },
  }));
  const topRedirects = [...redirectsWithHistoricalCounts]
    .sort((left, right) => right._count.clickEvents - left._count.clickEvents)
    .slice(0, 5);
  const recentActivity = recentClicks.slice(0, 6);
  const purposeCounts = [...redirectsWithHistoricalCounts.reduce((counts, redirect) => {
    counts.set(redirect.purpose, (counts.get(redirect.purpose) ?? 0) + 1);
    return counts;
  }, new Map<string, number>()).entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Overview of redirects and recent activity."
        eyebrow="Admin Console"
        title="Dashboard"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AccentMetricCard
          detail="Live redirect records"
          icon="R"
          label="Total Redirects"
          tone="blue"
          value={formatNumber(redirectCount)}
        />
        <AccentMetricCard
          detail="All recorded click events"
          icon="C"
          label="Total Clicks"
          tone="green"
          value={formatNumber(clickCount)}
        />
        <AccentMetricCard
          detail="Since local midnight"
          icon="T"
          label="Clicks Today"
          tone="amber"
          value={formatNumber(todayClickCount)}
        />
        <AccentMetricCard
          detail="Unknown short URL requests"
          icon="F"
          label="Fallback Clicks"
          tone="purple"
          value={formatNumber(fallbackClickCount)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)]">
        <AdminCard>
          <CardHeader
            actions={
              <Link className="text-sm font-medium text-[var(--pvm-muted)] hover:text-[var(--pvm-fg)]" href="/redirects">
                View all
              </Link>
            }
            subtitle="By total clicks, all time"
            title="Top Redirects"
          />
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--pvm-border)] text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]">
              <tr>
                <th className="px-4 py-3">Redirect</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3 text-right">Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--pvm-border)]">
              {topRedirects.map((redirect) => (
                <tr key={redirect.id}>
                  <td className="px-4 py-4">
                    <Link className="font-semibold text-[var(--pvm-fg)] hover:underline" href={`/redirects/${redirect.id}`}>
                      {redirect.title}
                    </Link>
                    <p className="mt-1 font-mono text-xs text-[var(--pvm-muted)]">
                      {shortUrlBase}/{redirect.code}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={purposeTone(redirect.purpose)}>
                      {purposeLabel(redirect.purpose)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-semibold tabular-nums">
                      {formatNumber(redirect._count.clickEvents)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>

        <AdminCard>
          <CardHeader subtitle="Latest clicks and changes" title="Recent Activity" />
          <div className="divide-y divide-[var(--pvm-border)]">
            {recentActivity.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[var(--pvm-muted)]">
                No recent activity yet.
              </p>
            ) : (
              recentActivity.map((click) => (
                <div className="flex items-start justify-between gap-4 px-5 py-4" key={`${click.createdAt.toISOString()}-${click.requestedCode}`}>
                  <div className="flex min-w-0 gap-3">
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${toneFillClass[outcomeTone(click.outcome)]}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--pvm-fg)]">
                        {click.redirect?.title ?? "Unknown redirect"} -{" "}
                        {click.outcome} click
                      </p>
                      <p className="mt-1 font-mono text-xs text-[var(--pvm-muted)]">
                        {click.redirectUrl
                          ? displayUrl(click.redirectUrl)
                          : `${shortUrlBase}/${click.redirect?.code ?? click.requestedCode}`}{" "}
                        - {click.referrerHost?.trim() || "No referrer"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--pvm-muted)]">
                        {formatClickLocation(click)}
                        {formatClickTimezone(click)
                          ? ` - ${formatClickTimezone(click)}`
                          : ""}
                      </p>
                      {formatClickUtm(click) ? (
                        <p className="mt-1 font-mono text-[11px] text-[var(--pvm-muted)]">
                          {formatClickUtm(click)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <time className="shrink-0 text-xs tabular-nums text-[var(--pvm-muted)]">
                    {click.createdAt.toLocaleTimeString("en-ZA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              ))
            )}
          </div>
        </AdminCard>
      </div>

      <AdminCard>
        <CardHeader
          actions={
            <span className="text-xs text-[var(--pvm-muted)]">
              Distribution across {formatNumber(redirectCount)} redirects
            </span>
          }
          title="Purpose breakdown"
        />
        <div className="grid gap-5 px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
          {purposeCounts.map(([purpose, count]) => (
            <div key={purpose}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <Badge tone={purposeTone(purpose)}>{purposeLabel(purpose)}</Badge>
                <span className="text-sm font-semibold tabular-nums">{count}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${toneFillClass[purposeTone(purpose)]}`}
                  style={{
                    width: `${Math.max(6, Math.round((count / Math.max(redirectCount, 1)) * 100))}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--pvm-muted)]">
                {Math.round((count / Math.max(redirectCount, 1)) * 100)}% -{" "}
                {formatNumber(count)} redirects
              </p>
            </div>
          ))}
          {purposeCounts.length === 0 ? (
            <p className="text-sm text-[var(--pvm-muted)]">No redirect mix yet.</p>
          ) : null}
        </div>
      </AdminCard>
    </div>
  );
}

function AccentMetricCard({
  detail,
  icon,
  label,
  tone,
  value,
}: Readonly<{
  detail: string;
  icon: string;
  label: string;
  tone: BadgeTone;
  value: string;
}>) {
  return (
    <AdminCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]">
            {label}
          </p>
          <p className="mt-3 text-[26px] font-bold leading-none text-[var(--pvm-fg)] tabular-nums">
            {value}
          </p>
          <p className="mt-3 text-[11.5px] text-[var(--pvm-muted)]">{detail}</p>
        </div>
        <span
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${toneSoftClass[tone]}`}
        >
          {icon}
        </span>
      </div>
    </AdminCard>
  );
}

async function getClickCountsByCode(codes: string[]) {
  if (codes.length === 0) {
    return new Map<string, number>();
  }

  const rows = await prisma.clickEvent.groupBy({
    by: ["requestedCode"],
    where: { requestedCode: { in: codes } },
    _count: { _all: true },
  });

  return new Map(rows.map((row) => [row.requestedCode, row._count._all]));
}

function displayUrl(href: string) {
  return href.replace(/^https?:\/\//, "");
}
