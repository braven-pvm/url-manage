import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SignInPage from "./sign-in/[[...sign-in]]/page";
import SignUpPage from "./sign-up/[[...sign-up]]/page";

vi.mock("@clerk/nextjs", () => ({
  SignIn: () => <div>Clerk sign-in form</div>,
  SignUp: () => <div>Clerk sign-up form</div>,
}));

describe("Clerk auth pages", () => {
  it("renders the sign-in route page", () => {
    render(<SignInPage />);

    expect(screen.getByText("Clerk sign-in form")).toBeInTheDocument();
  });

  it("renders the sign-up route page", () => {
    render(<SignUpPage />);

    expect(screen.getByText("Clerk sign-up form")).toBeInTheDocument();
  });
});
