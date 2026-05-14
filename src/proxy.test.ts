import { describe, expect, it } from "vitest";
import { config, isLegacyAdminRoute } from "./proxy";

function requestFor(pathname: string): Parameters<typeof isLegacyAdminRoute>[0] {
  return { nextUrl: { pathname } } as Parameters<typeof isLegacyAdminRoute>[0];
}

describe("proxy config", () => {
  it("matches Clerk frontend API proxy routes", () => {
    expect(config.matcher).toContain("/__clerk/(.*)");
  });

  it.each(["/admin", "/admin/settings"])(
    "matches legacy admin route %s",
    (pathname) => {
      expect(isLegacyAdminRoute(requestFor(pathname))).toBe(true);
    },
  );

  it.each(["/admin-sale", "/admin_2026", "/admin1", "/administrator"])(
    "does not protect public redirect code %s",
    (pathname) => {
      expect(isLegacyAdminRoute(requestFor(pathname))).toBe(false);
    },
  );
});
