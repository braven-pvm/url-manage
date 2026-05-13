import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATEGORIES,
  mergeCategorySuggestions,
  normalizeCategory,
} from "./redirect-metadata";

describe("redirect-metadata", () => {
  it("uses Referrals as the canonical default category", () => {
    expect(DEFAULT_CATEGORIES).toContain("Referrals");
    expect(DEFAULT_CATEGORIES).not.toContain("Referral");
  });

  it("normalizes category aliases and whitespace", () => {
    expect(normalizeCategory(" referral ")).toBe("Referrals");
    expect(normalizeCategory("referrals")).toBe("Referrals");
    expect(normalizeCategory(" referalls ")).toBe("Referrals");
    expect(normalizeCategory("  fixed   ")).toBe("Fixed");
    expect(normalizeCategory(" summer   qr campaign ")).toBe(
      "summer qr campaign",
    );
    expect(normalizeCategory("   ")).toBe("General");
  });

  it("deduplicates category suggestions after normalization", () => {
    expect(
      mergeCategorySuggestions([
        "Referral",
        " referrals ",
        "referalls",
        "Retail",
      ]).filter((category) => category.startsWith("Referral")),
    ).toEqual(["Referrals"]);
  });
});
