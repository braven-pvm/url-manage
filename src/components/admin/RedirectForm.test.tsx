import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RedirectForm } from "./RedirectForm";

describe("RedirectForm", () => {
  it("renders required create fields and an error message", () => {
    const { container } = render(
      <RedirectForm
        action={vi.fn()}
        error="Enter a valid URL"
        suggestedCategories={["General", "Fixed", "Temporary", "Referrals"]}
      />,
    );

    expect(screen.getByText("Basic information")).toBeInTheDocument();
    expect(screen.getByText("Classification")).toBeInTheDocument();
    expect(screen.getByText("Short URL preview")).toBeInTheDocument();
    expect(screen.getByText("QR Code")).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Leave blank to auto-generate"),
    ).toBeInTheDocument();
    expect(screen.getByText("Enter a valid URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeRequired();
    expect(screen.getByLabelText("Category")).toHaveValue("General");
    expect(screen.getByRole("option", { name: "Fixed" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Temporary" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Referrals" })).toBeInTheDocument();
    expect(screen.getByLabelText("Purpose")).toHaveValue("General");
    expect(container.querySelector<HTMLInputElement>('input[name="tags"]')).toHaveValue("");
    expect(screen.getByLabelText("Destination URL")).toBeRequired();
    expect(screen.queryByRole("button", { name: "Create redirect" })).not.toBeInTheDocument();
  });

  it("disables code editing for existing redirects", () => {
    const { container } = render(
      <RedirectForm
        action={vi.fn()}
        shortUrlBase="https://go.pvm.co.za"
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

    expect(screen.getByText("Short URL preview")).toBeInTheDocument();
    expect(screen.getByText("https://go.pvm.co.za/care")).toBeInTheDocument();
    expect(screen.getByLabelText("Code")).toBeDisabled();
    expect(screen.getByLabelText("Category")).toHaveValue("Product");
    expect(screen.getByLabelText("Purpose")).toHaveValue("Product packaging");
    expect(screen.getByText("energy-bar")).toBeInTheDocument();
    expect(screen.getByText("qr")).toBeInTheDocument();
    expect(container.querySelector<HTMLInputElement>('input[name="tags"]')).toHaveValue(
      "energy-bar, qr",
    );
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  });

  it("lets users add and remove tags before submit", async () => {
    const user = userEvent.setup();
    const { container } = render(<RedirectForm action={vi.fn()} />);

    await user.type(screen.getByLabelText("Tags"), "Retail activation{enter}");

    expect(screen.getByText("retail-activation")).toBeInTheDocument();
    expect(container.querySelector<HTMLInputElement>('input[name="tags"]')).toHaveValue(
      "retail-activation",
    );

    await user.click(screen.getByRole("button", { name: "Remove retail-activation" }));

    expect(screen.queryByText("retail-activation")).not.toBeInTheDocument();
    expect(container.querySelector<HTMLInputElement>('input[name="tags"]')).toHaveValue("");
  });
});
