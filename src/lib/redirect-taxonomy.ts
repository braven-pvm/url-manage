import {
  DEFAULT_CATEGORIES,
  normalizeCategory,
  normalizeTag,
} from "./redirect-metadata";

export { normalizeTag } from "./redirect-metadata";

export type RedirectTaxonomySource = {
  category: string;
  tags: string[];
};

export type TaxonomyCount = {
  name: string;
  count: number;
};

export function normalizeCatalogName(value: string): string {
  const normalized = normalizeCategory(value);

  if (normalized === "General") {
    return "General";
  }

  return DEFAULT_CATEGORIES.includes(normalized) ? normalized : titleCase(normalized);
}

export function buildTaxonomySummary(rows: RedirectTaxonomySource[]): {
  categories: TaxonomyCount[];
  tags: TaxonomyCount[];
} {
  const categoryCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();

  for (const category of DEFAULT_CATEGORIES) {
    categoryCounts.set(normalizeCatalogName(category), 0);
  }

  for (const row of rows) {
    const category = normalizeCatalogName(row.category);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);

    for (const tagSource of row.tags) {
      const tag = normalizeTag(tagSource);

      if (tag) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  return {
    categories: sortCounts(categoryCounts),
    tags: sortCounts(tagCounts),
  };
}

export function canDeleteTaxonomyItem(
  count: number,
): { ok: true } | { ok: false; message: string } {
  if (count === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    message: `Cannot delete while ${count} redirects still use it.`,
  };
}

export function catalogLabelFromTag(slug: string): string {
  return titleCase(slug.replace(/-/g, " "));
}

function sortCounts(counts: Map<string, number>): TaxonomyCount[] {
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name),
    );
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b[a-z0-9]/g, (character) => character.toUpperCase());
}
