import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsForm } from "./SettingsForm";

describe("SettingsForm", () => {
  it("renders the fallback URL field, helper text, error, and submit button", () => {
    render(
      <SettingsForm
        action={vi.fn()}
        error="Enter a valid URL"
        fallbackUrl="https://pvm.co.za"
      />,
    );

    const fallbackUrl = screen.getByLabelText("Fallback URL");

    expect(screen.getByText("Enter a valid URL")).toBeInTheDocument();
    expect(fallbackUrl).toBeRequired();
    expect(fallbackUrl).toHaveAttribute("id", "fallbackUrl");
    expect(fallbackUrl).toHaveAttribute("name", "fallbackUrl");
    expect(fallbackUrl).toHaveValue("https://pvm.co.za");
    expect(
      screen.getByText("Unknown or invalid short URLs redirect here."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save fallback" }),
    ).toBeInTheDocument();
  });
});
