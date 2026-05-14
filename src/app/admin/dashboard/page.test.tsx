import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminDashboardPage from "./page";

vi.mock("@/lib/admin-auth", () => ({
  requireAdminRole: vi.fn().mockResolvedValue({
    email: "viewer@pvm.co.za",
    role: "VIEWER",
  }),
}));

vi.mock("@/lib/env", () => ({
  env: {
    PUBLIC_REDIRECT_HOST: "go.pvm.co.za",
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clickEvent: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    redirect: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe("AdminDashboardPage", () => {
  it("does not render a duplicate page-level new redirect button", async () => {
    render(await AdminDashboardPage());

    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "+ New redirect" }),
    ).not.toBeInTheDocument();
  });
});
