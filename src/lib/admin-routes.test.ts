import { describe, expect, it } from "vitest";
import {
  cleanAdminPath,
  internalAdminPath,
  isSafeAdminRedirect,
} from "./admin-routes";

describe("admin route helpers", () => {
  it("maps legacy admin URLs to clean public admin URLs", () => {
    expect(cleanAdminPath("/admin")).toBe("/redirects");
    expect(cleanAdminPath("/admin/dashboard")).toBe("/dashboard");
    expect(cleanAdminPath("/admin/redirects/new")).toBe("/redirects/new");
  });

  it("maps clean admin URLs to internal route files", () => {
    expect(internalAdminPath("/redirects")).toBe("/admin");
    expect(internalAdminPath("/dashboard")).toBe("/admin/dashboard");
    expect(internalAdminPath("/redirects/r1")).toBe("/admin/redirects/r1");
  });

  it("keeps sign-up redirects away from administrator-only access management", () => {
    expect(isSafeAdminRedirect("/admin/access")).toBe(false);
    expect(isSafeAdminRedirect("/access")).toBe(false);
    expect(isSafeAdminRedirect("/dashboard")).toBe(true);
    expect(isSafeAdminRedirect("/admin/access", { allowAccess: true })).toBe(true);
  });
});
