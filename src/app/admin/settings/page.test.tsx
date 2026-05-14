import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsPage from "./page";
import { requireAdminRole } from "@/lib/admin-auth";
import { getGlobalFallbackUrl } from "@/lib/settings-service";

vi.mock("@/lib/admin-auth", () => ({
  requireAdminRole: vi.fn().mockResolvedValue({
    email: "admin@pvm.co.za",
    role: "ADMINISTRATOR",
  }),
}));

vi.mock("@/lib/settings-service", () => ({
  getGlobalFallbackUrl: vi.fn().mockResolvedValue("https://www.pvm.co.za/"),
}));

vi.mock("@/lib/env", () => ({
  env: {
    PUBLIC_REDIRECT_HOST: "go.pvm.co.za",
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("../actions", () => ({
  updateFallbackAction: vi.fn(),
}));

describe("SettingsPage", () => {
  it("renders only real redirect behaviour settings", async () => {
    render(await SettingsPage({ searchParams: Promise.resolve({}) }));

    expect(requireAdminRole).toHaveBeenCalledWith("ADMINISTRATOR");
    expect(getGlobalFallbackUrl).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Redirect behaviour")).toBeInTheDocument();
    expect(screen.getByLabelText("Fallback URL")).toHaveValue("https://www.pvm.co.za/");
    expect(screen.getByText("go.pvm.co.za")).toBeInTheDocument();
    expect(screen.queryByText("Access control")).not.toBeInTheDocument();
  });
});
