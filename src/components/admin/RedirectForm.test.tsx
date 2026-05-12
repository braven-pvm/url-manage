import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RedirectForm } from "./RedirectForm";

describe("RedirectForm", () => {
  it("renders required create fields and an error message", () => {
    render(<RedirectForm action={vi.fn()} error="Enter a valid URL" />);

    expect(screen.getByText("Enter a valid URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeRequired();
    expect(screen.getByLabelText("Destination URL")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Create redirect" }),
    ).toBeInTheDocument();
  });

  it("disables code editing for existing redirects", () => {
    render(
      <RedirectForm
        action={vi.fn()}
        redirect={{
          code: "care",
          destinationUrl: "https://shop.pvm.co.za/care",
          title: "Care",
          description: null,
          notes: null,
        }}
      />,
    );

    expect(screen.getByLabelText("Code")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Save redirect" }),
    ).toBeInTheDocument();
  });
});
