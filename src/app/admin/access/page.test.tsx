import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminAccessPage from "./page";
import { requireAdminRole } from "@/lib/admin-auth";

vi.mock("../actions", () => ({
  cancelAdminInvitationAction: vi.fn(),
  deleteAdminUserAction: vi.fn(),
  saveAdminUserAction: vi.fn(),
  sendAdminInvitationAction: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdminRole: vi.fn().mockResolvedValue({
    email: "admin@pvm.co.za",
    role: "ADMINISTRATOR",
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adminUser: {
      findMany: vi.fn().mockResolvedValue([
        {
          email: "admin@pvm.co.za",
          firstName: "Admin",
          lastName: "Person",
          role: "ADMINISTRATOR",
          createdBy: "system",
          updatedBy: "system",
          updatedAt: new Date("2026-05-13T08:00:00.000Z"),
        },
        {
          email: "editor@pvm.co.za",
          firstName: "Editor",
          lastName: "Person",
          role: "EDITOR",
          createdBy: "admin@pvm.co.za",
          updatedBy: "admin@pvm.co.za",
          updatedAt: new Date("2026-05-14T08:00:00.000Z"),
        },
      ]),
    },
    adminInvitation: {
      findMany: vi.fn().mockResolvedValue([
        {
          createdAt: new Date("2026-05-14T08:00:00.000Z"),
          createdBy: "admin@pvm.co.za",
          email: "pending@pvm.co.za",
          expiresAt: new Date("2026-05-21T08:00:00.000Z"),
          firstName: "Pending",
          id: "inv_1",
          invitationUrl: "https://accounts.dev/invite",
          lastName: "User",
          role: "VIEWER",
        },
      ]),
    },
  },
}));

describe("AdminAccessPage", () => {
  it("renders real access users, role controls, and capabilities", async () => {
    render(await AdminAccessPage({ searchParams: Promise.resolve({}) }));

    expect(requireAdminRole).toHaveBeenCalledWith("ADMINISTRATOR");
    expect(screen.getByRole("heading", { name: "Access Management" })).toBeInTheDocument();
    expect(screen.getByText("2 users")).toBeInTheDocument();
    expect(screen.getByText("Admin Person")).toBeInTheDocument();
    expect(screen.getByText("admin@pvm.co.za")).toBeInTheDocument();
    expect(screen.getByText("editor@pvm.co.za")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ Invite user" }));
    expect(screen.getByLabelText("Name")).toHaveAttribute("name", "firstName");
    expect(screen.getByLabelText("Surname")).toHaveAttribute("name", "lastName");
    expect(screen.getByLabelText("Email address")).toHaveAttribute("name", "email");
    expect(screen.getByRole("button", { name: "Send invite" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close invite user panel" }));
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();

    const editorRow = screen.getByTestId("access-user-editor@pvm.co.za");
    expect(within(editorRow).getByLabelText("Role for editor@pvm.co.za")).toHaveValue("EDITOR");
    expect(within(editorRow).getByRole("button", { name: "Save role for editor@pvm.co.za" })).toBeInTheDocument();
    expect(within(editorRow).getByRole("button", { name: "Remove editor@pvm.co.za" })).toBeInTheDocument();

    expect(screen.getByText("Role capabilities")).toBeInTheDocument();
    expect(screen.getByText("Pending invites")).toBeInTheDocument();
    expect(screen.getByText("Pending User")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open invite" })).toHaveAttribute(
      "href",
      "https://accounts.dev/invite",
    );
    expect(screen.getByText("Change system settings")).toBeInTheDocument();
    expect(screen.getByText("Cannot change settings")).toBeInTheDocument();
  });
});
