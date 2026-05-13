import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { RedirectForm } from "@/components/admin/RedirectForm";
import {
  AdminCard,
  Badge,
  CardHeader,
  MetricCard,
  PageHeader,
  SecondaryAnchor,
  TagChip,
  UrlDisplay,
} from "@/components/admin/ui";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { mergeCategorySuggestions } from "@/lib/redirect-metadata";
import { updateRedirectAction } from "../../actions";

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
  const shortUrlBase = `https://${env.PUBLIC_REDIRECT_HOST}`;
  const shortUrl = `${shortUrlBase}/${redirect.code}`;
  const destinationHost = getDestinationHost(redirect.destinationUrl);
  const lastClick = redirect.clickEvents[0];

  return (
    <div className="space-y-6">
      <Link
        className="text-sm font-semibold text-[var(--pvm-muted)] underline-offset-2 hover:text-[var(--pvm-fg)] hover:underline"
        href="/admin"
      >
        Back to redirects
      </Link>

      <PageHeader
        actions={
          <>
            <SecondaryAnchor href={redirect.destinationUrl}>
              Open destination
            </SecondaryAnchor>
            <SecondaryAnchor href={shortUrl}>Test short URL</SecondaryAnchor>
          </>
        }
        description="Edit the destination and admin metadata for this printed or QR URL. The public code remains fixed."
        eyebrow="Redirect editor"
        title={redirect.title}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={categoryTone(redirect.category)}>{redirect.category}</Badge>
        <Badge tone="purple">{redirect.purpose}</Badge>
        <Badge tone="green">Active</Badge>
        {redirect.tags.map((tag) => (
          <TagChip key={tag}>{tag}</TagChip>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <AdminCard className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]">
            Short URL
          </p>
          <div className="mt-3">
            <UrlDisplay href={shortUrl} showCopy />
          </div>
        </AdminCard>
        <AdminCard className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]">
            Destination
          </p>
          <div className="mt-3">
            <UrlDisplay href={redirect.destinationUrl} showCopy />
          </div>
          <p className="mt-2 text-[11.5px] text-[var(--pvm-muted)]">
            {destinationHost}
          </p>
        </AdminCard>
        <MetricCard
          detail={
            lastClick
              ? `Latest ${dateFormatter.format(lastClick.createdAt)}`
              : "No clicks recorded yet"
          }
          label="Click activity"
          value={redirect._count.clickEvents.toLocaleString("en-ZA")}
        />
      </section>

      <RedirectForm
        action={action}
        error={query.error}
        redirect={redirect}
        shortUrlBase={shortUrlBase}
        suggestedCategories={mergeCategorySuggestions(
          categories.map((item) => item.category),
        )}
      />

      <AdminCard>
        <CardHeader
          subtitle="Latest recorded redirect attempts for this code."
          title="Recent clicks"
        />
        {redirect.clickEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--pvm-border)] text-left text-sm">
              <thead className="bg-[var(--pvm-bg)]">
                <tr>
                  <ColumnHeader>Referrer</ColumnHeader>
                  <ColumnHeader>Device / Browser</ColumnHeader>
                  <ColumnHeader>Result</ColumnHeader>
                  <ColumnHeader>Timestamp</ColumnHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--pvm-border)]">
                {redirect.clickEvents.map((event) => (
                  <tr key={event.id} className="align-top">
                    <td className="max-w-[260px] px-5 py-4">
                      <p className="break-words font-medium text-[var(--pvm-fg)]">
                        {event.referrerHost?.trim() ||
                          event.referrer?.trim() ||
                          "Direct / No referrer"}
                      </p>
                      <ChipRow>
                        {locationLabel(event) ? (
                          <TagChip>{locationLabel(event)}</TagChip>
                        ) : null}
                        {event.region ? <TagChip>{event.region}</TagChip> : null}
                        {event.timezone ? <TagChip>{event.timezone}</TagChip> : null}
                      </ChipRow>
                    </td>
                    <td className="max-w-[340px] px-5 py-4">
                      <p className="text-sm font-medium text-[var(--pvm-fg)]">
                        {event.userAgent ? "Captured user agent" : "Unknown"}
                      </p>
                      {event.userAgent ? (
                        <p className="mt-1 line-clamp-3 break-words text-xs text-[var(--pvm-muted)]">
                          {event.userAgent}
                        </p>
                      ) : null}
                      {event.ipHash ? (
                        <p className="mt-2 font-mono text-[11px] text-[var(--pvm-muted)]">
                          ip:{event.ipHash.slice(0, 10)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={clickOutcomeTone(event.outcome)}>
                        {event.outcome}
                      </Badge>
                      <ChipRow>
                        {utmChips(event).map((chip) => (
                          <span
                            className="inline-flex items-center rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700"
                            key={chip}
                          >
                            {chip}
                          </span>
                        ))}
                      </ChipRow>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-[var(--pvm-muted)]">
                      {timestampFormatter.format(event.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-6 text-sm text-[var(--pvm-muted)]">
            No clicks recorded yet.
          </p>
        )}
      </AdminCard>
    </div>
  );
}

function ColumnHeader({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]">
      {children}
    </th>
  );
}

function ChipRow({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>;
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

function getDestinationHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "Invalid URL";
  }
}

function locationLabel(event: {
  city: string | null;
  country: string | null;
}) {
  return [event.city, event.country].filter(Boolean).join(", ");
}

function utmChips(event: {
  utmCampaign: string | null;
  utmContent: string | null;
  utmMedium: string | null;
  utmSource: string | null;
  utmTerm: string | null;
}) {
  return [
    event.utmSource ? `source:${event.utmSource}` : null,
    event.utmMedium ? `medium:${event.utmMedium}` : null,
    event.utmCampaign ? `campaign:${event.utmCampaign}` : null,
    event.utmContent ? `content:${event.utmContent}` : null,
    event.utmTerm ? `term:${event.utmTerm}` : null,
  ].filter((chip): chip is string => Boolean(chip));
}
