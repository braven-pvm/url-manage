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

  it("builds a sorted taxonomy summary from categories used by redirects", () => {
    const summary = buildTaxonomySummary([
      { category: " referalls ", tags: ["Energy Bar", "QR"] },
      { category: "referrals", tags: ["energy bar", "Retail"] },
      { category: "Referral", tags: ["QR"] },
      { category: "temporary", tags: ["QR", ""] },
      { category: "new category", tags: ["Retail"] },
    ]);

    expect(summary.categories).toEqual([
      { name: "Referrals", count: 3 },
      { name: "New Category", count: 1 },
      { name: "Temporary", count: 1 },
    ]);
    expect(summary.tags).toEqual([
      { name: "qr", count: 3 },
      { name: "energy-bar", count: 2 },
      { name: "retail", count: 2 },
    ]);
    expect(
      summary.categories.filter((item) => item.name.startsWith("Referral")),
    ).toEqual([{ name: "Referrals", count: 3 }]);
  });

  it("guards deletion while taxonomy items are still used", () => {
    expect(canDeleteTaxonomyItem(0)).toEqual({ ok: true });
    expect(canDeleteTaxonomyItem(3)).toEqual({
      ok: false,
      message: "Cannot delete while 3 redirects still use it.",
    });
  });
});
