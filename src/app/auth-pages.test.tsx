import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignInPage from "./sign-in/[[...sign-in]]/page";
import SignUpPage from "./sign-up/[[...sign-up]]/page";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
);
const signInWidgetMock = vi.hoisted(() =>
  vi.fn(({ fallbackRedirectUrl }: { fallbackRedirectUrl: string }) => (
    <div>Clerk sign-in form: {fallbackRedirectUrl}</div>
  )),
);
const signUpWidgetMock = vi.hoisted(() =>
  vi.fn(({ fallbackRedirectUrl }: { fallbackRedirectUrl: string }) => (
    <div>Clerk sign-up form: {fallbackRedirectUrl}</div>
  )),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/components/admin/AuthWidget", () => ({
  SignInWidget: signInWidgetMock,
  SignUpWidget: signUpWidgetMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("Clerk auth pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ isAuthenticated: false });
  });

  it("renders the sign-in route page", async () => {
    render(await SignInPage());

    expect(screen.getByText("Sign in to manage redirects")).toBeInTheDocument();
    expect(screen.getByText("Clerk sign-in form: /dashboard")).toBeInTheDocument();
  });

  it("renders the sign-up route page", async () => {
    render(await SignUpPage());

    expect(screen.getByText("Create your admin account")).toBeInTheDocument();
    expect(screen.getByText("Clerk sign-up form: /dashboard")).toBeInTheDocument();
  });

  it("uses the admin redirect_url for the Clerk sign-in fallback", async () => {
    render(
      await SignInPage({
        searchParams: Promise.resolve({ redirect_url: "/tags" }),
      }),
    );

    expect(screen.getByText("Clerk sign-in form: /tags")).toBeInTheDocument();
  });

  it("server-redirects already authenticated users to the admin redirect_url", async () => {
    authMock.mockResolvedValue({ isAuthenticated: true });

    await expect(
      SignInPage({
        searchParams: Promise.resolve({ redirect_url: "/access" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/access");
  });

  it("rejects non-admin redirect_url values", async () => {
    render(
      await SignInPage({
        searchParams: Promise.resolve({ redirect_url: "https://evil.test" }),
      }),
    );

    expect(screen.getByText("Clerk sign-in form: /dashboard")).toBeInTheDocument();
  });
});
