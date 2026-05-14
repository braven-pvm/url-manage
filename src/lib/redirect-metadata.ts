export const DEFAULT_CATEGORIES = [
  "General",
  "Fixed",
  "Temporary",
  "Referrals",
  "Promotion",
  "Internal",
];

export const REDIRECT_PURPOSES = [
  "General",
  "Product packaging",
  "Promotion",
  "Event",
  "Retail activation",
  "Support",
  "Internal",
  "Other",
];

export function normalizeCategory(value: string | undefined): string {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";

  if (!normalized) {
    return "General";
  }

  const alias = CATEGORY_ALIASES.get(normalized.toLowerCase());

  return alias ?? normalized;
}

export function normalizePurpose(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed || "General";
}

export function normalizeTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeTags(value: string | string[] | undefined): string[] {
  const source = Array.isArray(value) ? value : (value ?? "").split(/[,;\n]/);
  const tags = source.map(normalizeTag).filter(Boolean);
  return [...new Set(tags)];
}

export function mergeCategorySuggestions(values: string[]): string[] {
  return [
    ...new Set([...DEFAULT_CATEGORIES, ...values].map(normalizeCategory)),
  ];
}

const CATEGORY_ALIASES = new Map<string, string>([
  ["general", "General"],
  ["fixed", "Fixed"],
  ["temporary", "Temporary"],
  ["referral", "Referrals"],
  ["referrals", "Referrals"],
  ["referalls", "Referrals"],
  ["promotion", "Promotion"],
  ["promotions", "Promotion"],
  ["internal", "Internal"],
]);
