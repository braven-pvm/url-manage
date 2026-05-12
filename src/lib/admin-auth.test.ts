import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAdminEmail } from "./admin-auth";

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

describe("requireAdminEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAILS = "admin@pvm.co.za, ops@pvm.co.za";
    process.env.DEFAULT_FALLBACK_URL = "https://www.pvm.co.za/";
  });

  it("returns the lowercased primary email for an allowed admin", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    getUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: "Admin@PVM.co.za" },
    });

    await expect(requireAdminEmail()).resolves.toBe("admin@pvm.co.za");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects when the signed-in user email is not allowed", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    getUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: "person@example.com" },
    });

    await expect(requireAdminEmail()).rejects.toThrow(
      "NEXT_REDIRECT:/not-authorized",
    );
    expect(redirectMock).toHaveBeenCalledWith("/not-authorized");
  });

  it("redirects when there is no signed-in user", async () => {
    authMock.mockResolvedValue({ userId: null });

    await expect(requireAdminEmail()).rejects.toThrow(
      "NEXT_REDIRECT:/not-authorized",
    );
    expect(redirectMock).toHaveBeenCalledWith("/not-authorized");
    expect(getUserMock).not.toHaveBeenCalled();
  });
});
