import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  hasAdminRole,
  requireAdminEmail,
  requireAdminRole,
  type AdminRoleName,
} from "./admin-auth";
import { prisma } from "./prisma";

const authMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  clerkClient: vi.fn(async () => ({
    users: {
      getUser: getUserMock,
    },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("./prisma", () => ({
  prisma: {
    adminUser: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    adminInvitation: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (operations) => Promise.all(operations)),
  },
}));

describe("admin RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEFAULT_FALLBACK_URL = "https://www.pvm.co.za/";
    vi.mocked(prisma.adminInvitation.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.adminInvitation.update).mockResolvedValue({} as never);
    vi.mocked(prisma.adminUser.upsert).mockResolvedValue({
      email: "ops@pvm.co.za",
      role: "ADMINISTRATOR",
    } as never);
  });

  it("returns the user's stored role from the database", async () => {
    signedInAs("Admin@PVM.co.za");
    vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({
      email: "admin@pvm.co.za",
      role: "ADMINISTRATOR",
    } as never);

    await expect(requireAdminRole("VIEWER")).resolves.toEqual({
      email: "admin@pvm.co.za",
      role: "ADMINISTRATOR",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("requires a stored role or accepted invitation even when no admin rows exist", async () => {
    signedInAs("Ops@PVM.co.za");
    vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null);

    await expect(requireAdminRole("ADMINISTRATOR")).rejects.toThrow(
      "NEXT_REDIRECT:/not-authorized",
    );
    expect(prisma.adminUser.upsert).not.toHaveBeenCalled();
  });

  it("does not allow uninvited signed-in users", async () => {
    signedInAs("admin@pvm.co.za");
    vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null);

    await expect(requireAdminRole("VIEWER")).rejects.toThrow(
      "NEXT_REDIRECT:/not-authorized",
    );
    expect(prisma.adminUser.upsert).not.toHaveBeenCalled();
  });

  it("activates a pending invitation for the signed-in user", async () => {
    signedInAs("invitee@pvm.co.za", {
      pvmAdminRole: "EDITOR",
    });
    vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.adminInvitation.findFirst).mockResolvedValue({
      firstName: "Invite",
      id: "inv_1",
      lastName: "Person",
      role: "VIEWER",
    } as never);
    vi.mocked(prisma.adminUser.upsert).mockResolvedValue({
      email: "invitee@pvm.co.za",
      role: "EDITOR",
    } as never);

    await expect(requireAdminRole("EDITOR")).resolves.toEqual({
      email: "invitee@pvm.co.za",
      role: "EDITOR",
    });
    expect(prisma.adminUser.upsert).toHaveBeenCalledWith({
      where: { email: "invitee@pvm.co.za" },
      create: {
        clerkUserId: "user_123",
        createdBy: "clerk-invitation",
        email: "invitee@pvm.co.za",
        firstName: "Invite",
        lastName: "Person",
        role: "EDITOR",
        updatedBy: "clerk-invitation",
      },
      update: {
        clerkUserId: "user_123",
        firstName: "Invite",
        lastName: "Person",
        role: "EDITOR",
        updatedBy: "clerk-invitation",
      },
    });
    expect(prisma.adminInvitation.update).toHaveBeenCalledWith({
      where: { id: "inv_1" },
      data: {
        acceptedAt: expect.any(Date),
        status: "ACCEPTED",
        updatedBy: "clerk-invitation",
      },
    });
  });

  it("enforces role thresholds", async () => {
    signedInAs("viewer@pvm.co.za");
    vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({
      email: "viewer@pvm.co.za",
      role: "VIEWER",
    } as never);

    await expect(requireAdminRole("EDITOR")).rejects.toThrow(
      "NEXT_REDIRECT:/not-authorized",
    );
    expect(redirectMock).toHaveBeenCalledWith("/not-authorized");
  });

  it.each<[AdminRoleName, AdminRoleName, boolean]>([
    ["VIEWER", "VIEWER", true],
    ["EDITOR", "VIEWER", true],
    ["EDITOR", "EDITOR", true],
    ["VIEWER", "EDITOR", false],
    ["ADMINISTRATOR", "EDITOR", true],
    ["EDITOR", "ADMINISTRATOR", false],
  ])("checks whether %s satisfies %s", (role, requiredRole, expected) => {
    expect(hasAdminRole(role, requiredRole)).toBe(expected);
  });

  it("keeps requireAdminEmail as a Viewer-level compatibility helper", async () => {
    signedInAs("editor@pvm.co.za");
    vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({
      email: "editor@pvm.co.za",
      role: "EDITOR",
    } as never);

    await expect(requireAdminEmail()).resolves.toBe("editor@pvm.co.za");
  });
});

function signedInAs(email: string, publicMetadata: Record<string, unknown> = {}) {
  authMock.mockResolvedValue({ userId: "user_123" });
  getUserMock.mockResolvedValue({
    primaryEmailAddress: { emailAddress: email },
    publicMetadata,
  });
}
