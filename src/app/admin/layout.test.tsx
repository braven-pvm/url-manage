import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminLayout from "./layout";
import { requireAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/admin-auth", () => ({
  requireAdminRole: vi.fn().mockResolvedValue({
    email: "admin@pvm.co.za",
    role: "ADMINISTRATOR",
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    redirect: {
      count: vi.fn().mockResolvedValue(4),
    },
  },
}));

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <button type="button">User menu</button>,
}));

describe("AdminLayout", () => {
  it("renders the protected admin shell after requiring an active admin", async () => {
    render(await AdminLayout({ children: <p>Protected admin content</p> }));

    expect(requireAdminRole).toHaveBeenCalledWith("VIEWER");
    expect(prisma.redirect.count).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Protected admin content")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    const desktopNavigation = screen.getByRole("navigation", {
      name: "Admin navigation",
    });
    const mobileNavigation = screen.getByRole("navigation", {
      name: "Mobile admin navigation",
    });

    expect(desktopNavigation).toBeInTheDocument();
    expect(mobileNavigation).toBeInTheDocument();
    expect(
      within(mobileNavigation).getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      within(mobileNavigation).getByRole("link", { name: "All Redirects" }),
    ).toHaveAttribute("href", "/redirects");
    expect(
      within(mobileNavigation).getByRole("link", { name: "Tags & Categories" }),
    ).toHaveAttribute("href", "/tags");
    expect(
      within(mobileNavigation).getByRole("link", { name: "Access" }),
    ).toHaveAttribute("href", "/access");
    expect(
      within(mobileNavigation).getByRole("link", { name: "Settings" }),
    ).toHaveAttribute("href", "/settings");
    expect(
      within(desktopNavigation).getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      within(desktopNavigation).getByRole("link", { name: "All Redirects" }),
    ).toHaveAttribute("href", "/redirects");
    expect(within(desktopNavigation).getByText("4")).toBeInTheDocument();
    expect(
      within(desktopNavigation).getByRole("link", { name: "Tags & Categories" }),
    ).toHaveAttribute("href", "/tags");
    expect(
      within(desktopNavigation).getByRole("link", { name: "Access" }),
    ).toHaveAttribute("href", "/access");
    expect(
      screen.getByRole("link", { name: "+ New redirect" }),
    ).toHaveAttribute("href", "/redirects/new");
    expect(
      screen
        .getAllByRole("link", { name: "Settings" })
        .every((link) => link.getAttribute("href") === "/settings"),
    ).toBe(true);
    expect(screen.getByRole("button", { name: "User menu" })).toBeInTheDocument();
    expect(screen.getByText("admin@pvm.co.za")).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
  });
});
