import { describe, expect, it } from "vitest";
import { parseDestinationUrl } from "./url-validation";

describe("parseDestinationUrl", () => {
  it("accepts absolute https URLs", () => {
    expect(parseDestinationUrl("https://shop.pvm.co.za/products")).toEqual({
      ok: true,
      url: "https://shop.pvm.co.za/products",
    });
  });

  it("accepts absolute http URLs", () => {
    expect(parseDestinationUrl("http://example.com")).toEqual({
      ok: true,
      url: "http://example.com/",
    });
  });

  it("rejects relative URLs", () => {
    expect(parseDestinationUrl("/internal").ok).toBe(false);
  });

  it("rejects javascript URLs", () => {
    expect(parseDestinationUrl("javascript:alert(1)").ok).toBe(false);
  });
});
