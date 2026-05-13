import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminLayout from "./layout";
import { requireAdminEmail } from "@/lib/admin-auth";

vi.mock("@/lib/admin-auth", () => ({
  requireAdminEmail: vi.fn().mockResolvedValue("admin@pvm.co.za"),
}));

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <button type="button">User menu</button>,
}));

describe("AdminLayout", () => {
  it("renders the protected admin shell after requiring an allowlisted admin", async () => {
    render(await AdminLayout({ children: <p>Protected admin content</p> }));

    expect(requireAdminEmail).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Protected admin content")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    const desktopNavigation = screen.getByRole("navigation", {
      name: "Desktop admin navigation",
    });
    const mobileNavigation = screen.getByRole("navigation", {
      name: "Mobile admin navigation",
    });

    expect(desktopNavigation).toBeInTheDocument();
    expect(mobileNavigation).toBeInTheDocument();
    expect(
      within(mobileNavigation).getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("href", "/admin/dashboard");
    expect(
      within(mobileNavigation).getByRole("link", { name: "All Redirects" }),
    ).toHaveAttribute("href", "/admin");
    expect(
      within(mobileNavigation).getByRole("link", { name: "New Redirect" }),
    ).toHaveAttribute("href", "/admin/redirects/new");
    expect(
      within(mobileNavigation).getByRole("link", { name: "Tags & Categories" }),
    ).toHaveAttribute("href", "/admin/tags");
    expect(
      within(mobileNavigation).getByRole("link", { name: "Settings" }),
    ).toHaveAttribute("href", "/admin/settings");
    expect(
      within(desktopNavigation).getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("href", "/admin/dashboard");
    expect(
      within(desktopNavigation).getByRole("link", { name: "All Redirects" }),
    ).toHaveAttribute("href", "/admin");
    expect(
      within(desktopNavigation).getByRole("link", { name: "New Redirect" }),
    ).toHaveAttribute("href", "/admin/redirects/new");
    expect(
      within(desktopNavigation).getByRole("link", { name: "Tags & Categories" }),
    ).toHaveAttribute("href", "/admin/tags");
    expect(
      within(desktopNavigation).getByRole("link", { name: "Settings" }),
    ).toHaveAttribute("href", "/admin/settings");
    expect(screen.getByRole("button", { name: "User menu" })).toBeInTheDocument();
  });
});
