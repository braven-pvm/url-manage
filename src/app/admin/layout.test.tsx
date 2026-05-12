import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminLayout from "./layout";
import { requireAdminEmail } from "@/lib/admin-auth";

vi.mock("@/lib/admin-auth", () => ({
  requireAdminEmail: vi.fn().mockResolvedValue("admin@pvm.co.za"),
}));

describe("AdminLayout", () => {
  it("requires an allowlisted admin before rendering children", async () => {
    render(await AdminLayout({ children: <p>Protected admin content</p> }));

    expect(requireAdminEmail).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Protected admin content")).toBeInTheDocument();
  });
});
