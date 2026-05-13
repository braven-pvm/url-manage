import {
  AdminCard,
  Badge,
  CardHeader,
  MetricCard,
  PageHeader,
  PrimaryLink,
  TagChip,
} from "@/components/admin/ui";
import {
  buildClickSeries,
  buildTopReferrers,
  type TopReferrer,
} from "@/lib/admin-dashboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
});

function formatNumber(value: number) {
  return value.toLocaleString("en-ZA");
}

function categoryTone(category: string) {
  if (category === "Fixed") {
    return "green" as const;
  }

  if (category === "Temporary") {
    return "amber" as const;
  }

  return "blue" as const;
}

function clickOutcomeTone(outcome: string) {
  if (outcome === "matched") {
    return "green" as const;
  }

  if (outcome === "fallback") {
    return "amber" as const;
  }

  return "red" as const;
}

function ReferrerRows({ referrers }: Readonly<{ referrers: TopReferrer[] }>) {
  if (referrers.length === 0) {
    return (
      <p className="px-5 py-6 text-sm text-[var(--pvm-muted)]">
        No click referrers recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-4 px-5 py-4">
      {referrers.map((referrer) => (
        <div key={referrer.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-[var(--pvm-fg)]">
              {referrer.label}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-[var(--pvm-muted)]">
              {formatNumber(referrer.count)} clicks · {referrer.percentage}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--pvm-bg)]">
            <div
              className="h-full rounded-full bg-[var(--pvm-teal)]"
              style={{ width: `${referrer.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [
    redirectCount,
    clickCount,
    fixedCount,
    temporaryCount,
    recentRedirects,
    recentClicks,
  ] = await Promise.all([
    prisma.redirect.count(),
    prisma.clickEvent.count(),
    prisma.redirect.count({ where: { category: "Fixed" } }),
    prisma.redirect.count({ where: { category: "Temporary" } }),
    prisma.redirect.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        _count: { select: { clickEvents: true } },
        category: true,
        code: true,
        id: true,
        purpose: true,
        tags: true,
        title: true,
        updatedAt: true,
      },
      take: 5,
    }),
    prisma.clickEvent.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        outcome: true,
        redirect: { select: { code: true, title: true } },
        referrerHost: true,
        requestedCode: true,
      },
      take: 100,
    }),
  ]);

  const topReferrers = buildTopReferrers(recentClicks);
  const clickSeries = buildClickSeries(recentClicks, new Date(), 7);
  const maxDailyClicks = Math.max(...clickSeries.map((day) => day.count), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={<PrimaryLink href="/admin/redirects/new">New redirect</PrimaryLink>}
        description="Overview of redirects and recent activity."
        eyebrow="Admin Console"
        title="Dashboard"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Redirects" value={formatNumber(redirectCount)} />
        <MetricCard label="Total Clicks" value={formatNumber(clickCount)} />
        <MetricCard label="Fixed URLs" value={formatNumber(fixedCount)} />
        <MetricCard label="Temporary URLs" value={formatNumber(temporaryCount)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <AdminCard>
          <CardHeader
            subtitle="Recent click events by UTC calendar day."
            title="Click activity"
          />
          <div className="grid gap-3 px-5 py-4 sm:grid-cols-7">
            {clickSeries.map((day) => (
              <div
                className="flex min-h-32 flex-col justify-end rounded-md border border-[var(--pvm-border)] bg-[var(--pvm-bg)] p-3"
                key={day.label}
              >
                <div className="mb-3 flex flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-[var(--pvm-teal)]"
                    style={{
                      height: `${Math.max(8, (day.count / maxDailyClicks) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] font-semibold tabular-nums text-[var(--pvm-fg)]">
                  {formatNumber(day.count)}
                </p>
                <p className="mt-1 text-[10.5px] tabular-nums text-[var(--pvm-muted)]">
                  {day.label}
                </p>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <CardHeader
            subtitle="Top sources from the latest 100 click events."
            title="Top referrers"
          />
          <ReferrerRows referrers={topReferrers} />
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard>
          <CardHeader
            subtitle="The latest redirects changed in the admin console."
            title="Recent redirect updates"
          />
          <div className="divide-y divide-[var(--pvm-border)]">
            {recentRedirects.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[var(--pvm-muted)]">
                No redirects have been created yet.
              </p>
            ) : (
              recentRedirects.map((redirect) => (
                <div className="px-5 py-4" key={redirect.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-[var(--pvm-teal)]">
                        /{redirect.code}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--pvm-fg)]">
                        {redirect.title}
                      </p>
                    </div>
                    <Badge tone={categoryTone(redirect.category)}>
                      {redirect.category}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge>{redirect.purpose}</Badge>
                    {redirect.tags.slice(0, 4).map((tag) => (
                      <TagChip key={tag}>{tag}</TagChip>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-[var(--pvm-muted)]">
                    {formatNumber(redirect._count.clickEvents)} clicks · Updated{" "}
                    {dateFormatter.format(redirect.updatedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <CardHeader
            subtitle="Most recent click events captured by the redirect route."
            title="Recent clicks"
          />
          <div className="divide-y divide-[var(--pvm-border)]">
            {recentClicks.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[var(--pvm-muted)]">
                No click events have been recorded yet.
              </p>
            ) : (
              recentClicks.slice(0, 8).map((click) => (
                <div
                  className="flex items-start justify-between gap-4 px-5 py-4"
                  key={`${click.createdAt.toISOString()}-${click.requestedCode}`}
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-[var(--pvm-fg)]">
                      /{click.redirect?.code ?? click.requestedCode}
                    </p>
                    <p className="mt-1 text-xs text-[var(--pvm-muted)]">
                      {click.redirect?.title ?? "Unmatched redirect"} ·{" "}
                      {click.referrerHost?.trim() || "Direct / No referrer"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone={clickOutcomeTone(click.outcome)}>
                      {click.outcome}
                    </Badge>
                    <p className="mt-2 text-[11px] tabular-nums text-[var(--pvm-muted)]">
                      {timeFormatter.format(click.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
