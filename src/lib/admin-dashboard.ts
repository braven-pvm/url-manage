export type ClickSeriesEvent = { createdAt: Date };
export type ReferrerEvent = { referrerHost: string | null };

export type ClickSeriesDay = {
  label: string;
  count: number;
};

export type TopReferrer = {
  label: string;
  count: number;
  percentage: number;
};

const directReferrerLabel = "Direct / No referrer";

const utcDayFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
});

function toUtcDayKey(date: Date) {
  return utcDayFormatter.format(date);
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function buildClickSeries(
  events: ClickSeriesEvent[],
  now: Date,
  days: number,
): ClickSeriesDay[] {
  const safeDays = Math.max(0, Math.floor(days));
  const today = startOfUtcDay(now);
  const firstDay = new Date(today);
  firstDay.setUTCDate(today.getUTCDate() - safeDays + 1);

  const counts = new Map<string, number>();

  for (const event of events) {
    const eventDay = startOfUtcDay(event.createdAt);

    if (eventDay < firstDay || eventDay > today) {
      continue;
    }

    const label = toUtcDayKey(eventDay);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from({ length: safeDays }, (_, index) => {
    const day = new Date(firstDay);
    day.setUTCDate(firstDay.getUTCDate() + index);
    const label = toUtcDayKey(day);

    return {
      label,
      count: counts.get(label) ?? 0,
    };
  });
}

export function buildTopReferrers(events: ReferrerEvent[]): TopReferrer[] {
  const total = events.length;
  const counts = new Map<string, number>();

  for (const event of events) {
    const label = event.referrerHost?.trim() || directReferrerLabel;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts, ([label, count]) => ({
    label,
    count,
    percentage: total === 0 ? 0 : Math.round((count / total) * 100),
  }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 5);
}
