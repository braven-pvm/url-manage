import { describe, expect, it } from "vitest";
import { generateCode, normalizeCode, validateCode } from "./codes";

describe("codes", () => {
  it("normalizes codes to lowercase trimmed values", () => {
    expect(normalizeCode("  Summer-2026  ")).toBe("summer-2026");
  });

  it("accepts print-safe codes", () => {
    expect(validateCode("product-care").ok).toBe(true);
    expect(validateCode("promo_2026").ok).toBe(true);
  });

  it("returns normalized code for uppercase input", () => {
    expect(validateCode(" Product-Care ")).toEqual({
      ok: true,
      code: "product-care",
    });
  });

  it("rejects unsafe codes", () => {
    expect(validateCode("../admin").ok).toBe(false);
    expect(validateCode("has space").ok).toBe(false);
    expect(validateCode("").ok).toBe(false);
  });

  it("rejects leading or trailing separators", () => {
    expect(validateCode("-product").ok).toBe(false);
    expect(validateCode("_product").ok).toBe(false);
    expect(validateCode("product-").ok).toBe(false);
    expect(validateCode("product_").ok).toBe(false);
  });

  it("rejects reserved codes", () => {
    expect(validateCode("admin").ok).toBe(false);
    expect(validateCode("sign-in").ok).toBe(false);
    expect(validateCode("sign-up").ok).toBe(false);
  });

  it("generates a valid 8-character code", () => {
    const code = generateCode();
    expect(validateCode(code).ok).toBe(true);
    expect(code).toHaveLength(8);
  });
});
