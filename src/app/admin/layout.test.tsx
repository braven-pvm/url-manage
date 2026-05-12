import { render, screen } from "@testing-library/react";
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
  it("requires an allowlisted admin before rendering children", async () => {
    render(await AdminLayout({ children: <p>Protected admin content</p> }));

    expect(requireAdminEmail).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Protected admin content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "PVM URL Admin" })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(screen.getByRole("link", { name: "New redirect" })).toHaveAttribute(
      "href",
      "/admin/redirects/new",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/admin/settings",
    );
    expect(screen.getByRole("button", { name: "User menu" })).toBeInTheDocument();
  });
});
