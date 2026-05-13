import { describe, expect, it } from "vitest";
import {
  buildTaxonomySummary,
  canDeleteTaxonomyItem,
  normalizeCatalogName,
  normalizeTag,
} from "./redirect-taxonomy";

describe("redirect-taxonomy", () => {
  it("normalizes catalog names with aliases and title casing", () => {
    expect(normalizeCatalogName("  referalls   ")).toBe("Referrals");
    expect(normalizeCatalogName("referral")).toBe("Referrals");
    expect(normalizeCatalogName(" PROMOTIONS ")).toBe("Promotion");
    expect(normalizeCatalogName("summer qr campaign")).toBe(
      "Summer Qr Campaign",
    );
  });

  it("normalizes tag names to stable slugs", () => {
    expect(normalizeTag(" Race 2026 ")).toBe("race-2026");
  });

  it("builds a sorted taxonomy summary with default categories", () => {
    const summary = buildTaxonomySummary([
      { category: " referalls ", tags: ["Energy Bar", "QR"] },
      { category: "referrals", tags: ["energy bar", "Retail"] },
      { category: "temporary", tags: ["QR", ""] },
      { category: "new category", tags: ["Retail"] },
    ]);

    expect(summary.categories).toEqual([
      { name: "Referrals", count: 2 },
      { name: "New Category", count: 1 },
      { name: "Temporary", count: 1 },
      { name: "Fixed", count: 0 },
      { name: "General", count: 0 },
      { name: "Internal", count: 0 },
      { name: "Promotion", count: 0 },
      { name: "Referral", count: 0 },
    ]);
    expect(summary.tags).toEqual([
      { name: "energy-bar", count: 2 },
      { name: "qr", count: 2 },
      { name: "retail", count: 2 },
    ]);
  });

  it("guards deletion while taxonomy items are still used", () => {
    expect(canDeleteTaxonomyItem(0)).toEqual({ ok: true });
    expect(canDeleteTaxonomyItem(3)).toEqual({
      ok: false,
      message: "Cannot delete while 3 redirects still use it.",
    });
  });
});
