import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RedirectForm } from "./RedirectForm";

describe("RedirectForm", () => {
  it("renders required create fields and an error message", () => {
    render(
      <RedirectForm
        action={vi.fn()}
        error="Enter a valid URL"
        suggestedCategories={["General", "Fixed", "Temporary", "Referral"]}
      />,
    );

    expect(screen.getByText("Enter a valid URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeRequired();
    expect(screen.getByLabelText("Category")).toHaveValue("General");
    expect(screen.getByRole("option", { name: "Fixed" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Temporary" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Referral" })).toBeInTheDocument();
    expect(screen.getByLabelText("Purpose")).toHaveValue("General");
    expect(screen.getByLabelText("Tags")).toHaveValue("");
    expect(screen.getByLabelText("Destination URL")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Create redirect" }),
    ).toBeInTheDocument();
  });

  it("disables code editing for existing redirects", () => {
    render(
      <RedirectForm
        action={vi.fn()}
        suggestedCategories={["General", "Fixed", "Temporary", "Product"]}
        redirect={{
          code: "care",
          category: "Product",
          purpose: "Product packaging",
          tags: ["energy-bar", "qr"],
          destinationUrl: "https://shop.pvm.co.za/care",
          title: "Care",
          description: null,
          notes: null,
        }}
      />,
    );

    expect(screen.getByLabelText("Code")).toBeDisabled();
    expect(screen.getByLabelText("Category")).toHaveValue("Product");
    expect(screen.getByLabelText("Purpose")).toHaveValue("Product packaging");
    expect(screen.getByLabelText("Tags")).toHaveValue("energy-bar, qr");
    expect(
      screen.getByRole("button", { name: "Save changes" }),
    ).toBeInTheDocument();
  });
});
