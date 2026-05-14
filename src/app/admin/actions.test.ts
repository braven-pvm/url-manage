import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteCategoryAction,
  deleteAdminUserAction,
  deleteTagAction,
  renameCategoryAction,
  renameTagAction,
  saveAdminUserAction,
  sendAdminInvitationAction,
} from "./actions";
import { prisma } from "@/lib/prisma";

const redirectMock = vi.hoisted(() => vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
}));
const createInvitationMock = vi.hoisted(() => vi.fn());
const revokeInvitationMock = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn(async () => ({
    invitations: {
      createInvitation: createInvitationMock,
      revokeInvitation: revokeInvitationMock,
    },
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdminRole: vi.fn().mockResolvedValue({
    email: "editor@pvm.co.za",
    role: "EDITOR",
  }),
}));

vi.mock("@/lib/env", () => ({
  env: {
    ADMIN_HOST: "admin.pvm.co.za",
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    redirect: {
      count: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    redirectCategory: {
      delete: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    redirectTag: {
      delete: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    adminUser: {
      count: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    adminInvitation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (operations) => Promise.all(operations)),
  },
}));

describe("admin taxonomy actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.redirectTag.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.redirectTag.delete).mockResolvedValue({} as never);
    vi.mocked(prisma.redirectTag.deleteMany).mockResolvedValue({} as never);
    vi.mocked(prisma.redirectCategory.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.redirectCategory.delete).mockResolvedValue({} as never);
    vi.mocked(prisma.redirectCategory.deleteMany).mockResolvedValue({} as never);
    vi.mocked(prisma.redirect.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.redirect.update).mockResolvedValue({} as never);
    vi.mocked(prisma.redirect.updateMany).mockResolvedValue({} as never);
    vi.mocked(prisma.redirect.count).mockResolvedValue(0);
    vi.mocked(prisma.adminUser.count).mockResolvedValue(2);
    vi.mocked(prisma.adminUser.delete).mockResolvedValue({} as never);
    vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({
      role: "EDITOR",
    } as never);
    vi.mocked(prisma.adminUser.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.adminInvitation.findUnique).mockResolvedValue({
      clerkInvitationId: "inv_clerk_1",
      status: "PENDING",
    } as never);
    vi.mocked(prisma.adminInvitation.update).mockResolvedValue({} as never);
    vi.mocked(prisma.adminInvitation.create).mockResolvedValue({} as never);
    vi.mocked(prisma.adminInvitation.findFirst).mockResolvedValue(null);
    createInvitationMock.mockResolvedValue({
      id: "inv_clerk_1",
      url: "https://accounts.dev/invitations/accept",
    });
    revokeInvitationMock.mockResolvedValue({});
  });

  it("renames a category and updates redirects that reference it", async () => {
    const formData = new FormData();
    formData.set("name", "Campaigns");

    await expect(renameCategoryAction("Promotion", formData)).rejects.toThrow(
      "NEXT_REDIRECT:/tags?categoryRenamed=1",
    );

    expect(prisma.redirectCategory.upsert).toHaveBeenCalledWith({
      where: { name: "Campaigns" },
      create: {
        name: "Campaigns",
        createdBy: "editor@pvm.co.za",
        updatedBy: "editor@pvm.co.za",
      },
      update: {
        updatedBy: "editor@pvm.co.za",
      },
    });
    expect(prisma.redirect.updateMany).toHaveBeenCalledWith({
      where: { category: "Promotion" },
      data: { category: "Campaigns" },
    });
  });

  it("blocks deleting a category while redirects still reference it", async () => {
    vi.mocked(prisma.redirect.count).mockResolvedValue(1);

    await expect(deleteCategoryAction("Fixed")).rejects.toThrow(
      "NEXT_REDIRECT:/tags?error=Cannot%20delete%20category%20while%201%20redirects%20still%20use%20it",
    );

    expect(prisma.redirectCategory.delete).not.toHaveBeenCalled();
  });

  it("renames a tag and updates redirects that reference it", async () => {
    vi.mocked(prisma.redirect.findMany).mockResolvedValue([
      { id: "r1", tags: ["old-tag", "qr"] },
      { id: "r2", tags: ["old-tag"] },
    ] as never);
    const formData = new FormData();
    formData.set("name", "New Tag");

    await expect(renameTagAction("old-tag", formData)).rejects.toThrow(
      "NEXT_REDIRECT:/tags?tagRenamed=1",
    );

    expect(prisma.redirectTag.upsert).toHaveBeenCalledWith({
      where: { slug: "new-tag" },
      create: {
        slug: "new-tag",
        label: "new-tag",
        createdBy: "editor@pvm.co.za",
        updatedBy: "editor@pvm.co.za",
      },
      update: {
        label: "new-tag",
        updatedBy: "editor@pvm.co.za",
      },
    });
    expect(prisma.redirect.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { tags: { set: ["new-tag", "qr"] } },
    });
    expect(prisma.redirect.update).toHaveBeenCalledWith({
      where: { id: "r2" },
      data: { tags: { set: ["new-tag"] } },
    });
  });

  it("blocks deleting a tag while redirects still reference it", async () => {
    vi.mocked(prisma.redirect.count).mockResolvedValue(2);

    await expect(deleteTagAction("in-use")).rejects.toThrow(
      "NEXT_REDIRECT:/tags?error=Cannot%20delete%20tag%20while%202%20redirects%20still%20use%20it",
    );

    expect(prisma.redirectTag.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes an unreferenced tag", async () => {
    await expect(deleteTagAction("unused")).rejects.toThrow(
      "NEXT_REDIRECT:/tags?tagDeleted=1",
    );

    expect(prisma.redirectTag.deleteMany).toHaveBeenCalledWith({
      where: { slug: "unused" },
    });
  });

  it("grants access and returns to the access screen", async () => {
    const formData = new FormData();
    formData.set("email", "New.User@pvm.co.za");
    formData.set("role", "VIEWER");

    await expect(saveAdminUserAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/access?accessSaved=1",
    );

    expect(prisma.adminUser.upsert).toHaveBeenCalledWith({
      where: { email: "new.user@pvm.co.za" },
      create: {
        email: "new.user@pvm.co.za",
        role: "VIEWER",
        createdBy: "editor@pvm.co.za",
        updatedBy: "editor@pvm.co.za",
      },
      update: {
        role: "VIEWER",
        updatedBy: "editor@pvm.co.za",
      },
    });
  });

  it("sends a Clerk invitation and stores it as pending", async () => {
    vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null);
    const formData = new FormData();
    formData.set("firstName", "Sarah");
    formData.set("lastName", "Naidoo");
    formData.set("email", "Sarah@pvm.co.za");
    formData.set("role", "EDITOR");

    await expect(sendAdminInvitationAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/access?inviteSent=1",
    );

    expect(createInvitationMock).toHaveBeenCalledWith({
      emailAddress: "sarah@pvm.co.za",
      expiresInDays: 7,
      notify: true,
      publicMetadata: {
        pvmAdminFirstName: "Sarah",
        pvmAdminLastName: "Naidoo",
        pvmAdminRole: "EDITOR",
      },
    });
    expect(prisma.adminInvitation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clerkInvitationId: "inv_clerk_1",
        createdBy: "editor@pvm.co.za",
        email: "sarah@pvm.co.za",
        firstName: "Sarah",
        invitationUrl: "https://accounts.dev/invitations/accept",
        lastName: "Naidoo",
        role: "EDITOR",
        updatedBy: "editor@pvm.co.za",
      }),
    });
  });

  it("surfaces structured Clerk invitation errors", async () => {
    vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null);
    createInvitationMock.mockRejectedValue({
      errors: [
        {
          code: "form_param_format_invalid",
          longMessage: "The redirect URL is not allowed.",
        },
      ],
      message: "Bad Request",
      status: 400,
    });
    const formData = new FormData();
    formData.set("firstName", "Sarah");
    formData.set("lastName", "Naidoo");
    formData.set("email", "Sarah@pvm.co.za");
    formData.set("role", "EDITOR");

    await expect(sendAdminInvitationAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/access?error=The%20redirect%20URL%20is%20not%20allowed.",
    );
  });

  it("removes access and returns to the access screen", async () => {
    await expect(deleteAdminUserAction("viewer@pvm.co.za")).rejects.toThrow(
      "NEXT_REDIRECT:/access?accessDeleted=1",
    );

    expect(prisma.adminUser.delete).toHaveBeenCalledWith({
      where: { email: "viewer@pvm.co.za" },
    });
  });
});
