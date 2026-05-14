import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminTagsPage from "./page";
import { prisma } from "@/lib/prisma";

vi.mock("../actions", () => ({
  createCategoryAction: vi.fn(),
  createTagAction: vi.fn(),
  deleteCategoryAction: vi.fn(),
  deleteTagAction: vi.fn(),
  renameCategoryAction: vi.fn(),
  renameTagAction: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdminRole: vi.fn().mockResolvedValue({
    email: "editor@pvm.co.za",
    role: "EDITOR",
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    redirect: {
      findMany: vi.fn().mockResolvedValue([
        { category: "Fixed", tags: ["packaging"] },
      ]),
    },
    redirectCategory: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    redirectTag: {
      findMany: vi.fn().mockResolvedValue([
        { slug: "packaging", label: "packaging" },
      ]),
    },
  },
}));

describe("AdminTagsPage", () => {
  it("renders taxonomy management controls and merged rows", async () => {
    render(await AdminTagsPage());

    expect(
      screen.getByRole("heading", { name: "Tags & Categories" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Purpose types")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add category" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add tag" })).toBeInTheDocument();
    expect(screen.getByText("Fixed")).toBeInTheDocument();
    expect(screen.getByText("packaging")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Rename category Fixed"),
    ).toHaveValue("Fixed");
    expect(screen.getByLabelText("Rename tag packaging")).toHaveValue(
      "packaging",
    );
    expect(
      screen.getByRole("button", { name: "Delete tag packaging" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Delete category Fixed" }),
    ).toBeDisabled();
    expect(prisma.redirect.findMany).toHaveBeenCalled();
  });
});
