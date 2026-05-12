import { describe, expect, it } from "vitest";
import { config } from "./proxy";

describe("proxy config", () => {
  it("matches Clerk frontend API proxy routes", () => {
    expect(config.matcher).toContain("/__clerk/(.*)");
  });
});
