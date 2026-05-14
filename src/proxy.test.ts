import { describe, expect, it } from "vitest";
import {
  config,
  getExternalAdminHostRedirectUrl,
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
      getExternalAdminHostRedirectUrl(
        new URL("https://go.pvm.co.za/dashboard?range=7d"),
        "admin.pvm.co.za",
      )?.toString(),
    ).toBe("https://admin.pvm.co.za/dashboard?range=7d");
  });

  it("redirects legacy admin paths on the public redirect host to clean admin URLs", () => {
    expect(
      getExternalAdminHostRedirectUrl(
        new URL("https://go.pvm.co.za/admin/tags"),
        "admin.pvm.co.za",
      )?.toString(),
    ).toBe("https://admin.pvm.co.za/tags");
  });

  it("redirects clean admin paths away from Vercel deployment hosts", () => {
    expect(
      getExternalAdminHostRedirectUrl(
        new URL(
          "https://url-manage-isjicib6m-pvm-developer-s-projects.vercel.app/dashboard",
        ),
        "admin.pvm.co.za",
      )?.toString(),
    ).toBe("https://admin.pvm.co.za/dashboard");
  });

  it("leaves real public redirect codes on the public redirect host alone", () => {
    expect(
      getExternalAdminHostRedirectUrl(
        new URL("https://go.pvm.co.za/energy-bar"),
        "admin.pvm.co.za",
      ),
    ).toBeNull();
  });

  it("leaves admin paths on localhost alone for development", () => {
    expect(
      getExternalAdminHostRedirectUrl(
        new URL("http://localhost:3001/dashboard"),
        "admin.pvm.co.za",
      ),
    ).toBeNull();
  });
});
