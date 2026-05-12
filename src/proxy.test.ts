import { describe, expect, it } from "vitest";
import { config, isAdminRoute } from "./proxy";

function requestFor(pathname: string) {
  return { nextUrl: { pathname } } as Parameters<typeof isAdminRoute>[0];
}

describe("proxy config", () => {
  it("matches Clerk frontend API proxy routes", () => {
    expect(config.matcher).toContain("/__clerk/(.*)");
  });

  it.each(["/admin", "/admin/settings"])(
    "protects exact admin route %s",
    (pathname) => {
      expect(isAdminRoute(requestFor(pathname))).toBe(true);
    },
  );

  it.each(["/admin-sale", "/admin_2026", "/admin1", "/administrator"])(
    "does not protect public redirect code %s",
    (pathname) => {
      expect(isAdminRoute(requestFor(pathname))).toBe(false);
    },
  );
});
