import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { QrPanel } from "./QrPanel";

describe("QrPanel", () => {
  it("renders QR code preview image", () => {
    render(<QrPanel code="test123" />);
    const img = screen.getByRole("img", { name: "QR code preview" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("/api/qr/test123"));
  });

  it("download link uses the selected format as extension", () => {
    render(<QrPanel code="test123" />);
    const link = screen.getByRole("link", { name: /download svg/i });
    expect(link).toHaveAttribute("download", "qr-test123.svg");
  });

  it("switching to PNG changes the download filename", async () => {
    render(<QrPanel code="abc" />);
    await userEvent.click(screen.getByLabelText("Png"));
    const link = screen.getByRole("link", { name: /download png/i });
    expect(link).toHaveAttribute("download", "qr-abc.png");
  });

  it("shows size selector only for PNG format", async () => {
    render(<QrPanel code="abc" />);
    expect(screen.queryByText("Size (px)")).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Png"));
    expect(screen.getByText("Size (px)")).toBeInTheDocument();
  });
});
