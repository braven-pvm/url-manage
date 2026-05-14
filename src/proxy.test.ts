import { describe, expect, it } from "vitest";
import {
  config,
  getPublicAdminHostRedirectUrl,
  isLegacyAdminRoute,
} from "./proxy";

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

  it("redirects clean admin paths away from the public redirect host", () => {
    expect(
      getPublicAdminHostRedirectUrl(
        new URL("https://go.pvm.co.za/dashboard?range=7d"),
        "go.pvm.co.za",
        "admin.pvm.co.za",
      )?.toString(),
    ).toBe("https://admin.pvm.co.za/dashboard?range=7d");
  });

  it("redirects legacy admin paths on the public redirect host to clean admin URLs", () => {
    expect(
      getPublicAdminHostRedirectUrl(
        new URL("https://go.pvm.co.za/admin/tags"),
        "go.pvm.co.za",
        "admin.pvm.co.za",
      )?.toString(),
    ).toBe("https://admin.pvm.co.za/tags");
  });

  it("leaves real public redirect codes on the public redirect host alone", () => {
    expect(
      getPublicAdminHostRedirectUrl(
        new URL("https://go.pvm.co.za/energy-bar"),
        "go.pvm.co.za",
        "admin.pvm.co.za",
      ),
    ).toBeNull();
  });
});
