import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { QrPanel } from "./QrPanel";

describe("QrPanel", () => {
  it("renders QR code preview image with api URL", () => {
    render(<QrPanel code="test123" />);
    const img = screen.getByRole("img", { name: "QR code preview" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("/api/qr/test123"));
  });

  it("default download link has svg extension", () => {
    render(<QrPanel code="test123" />);
    const link = screen.getByRole("link", { name: /download svg/i });
    expect(link).toHaveAttribute("download", "qr-test123.svg");
  });

  it("switching to PNG changes download filename", async () => {
    render(<QrPanel code="abc" />);
    await userEvent.click(screen.getByLabelText("PNG"));
    const link = screen.getByRole("link", { name: /download png/i });
    expect(link).toHaveAttribute("download", "qr-abc.png");
  });

  it("shows size selector only for PNG format", async () => {
    render(<QrPanel code="abc" />);
    expect(screen.queryByText("Size (px)")).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("PNG"));
    expect(screen.getByText("Size (px)")).toBeInTheDocument();
  });

  it("Brand preset is active by default and fg included in preview URL", () => {
    render(<QrPanel code="test" />);
    const img = screen.getByRole("img", { name: "QR code preview" });
    expect(img).toHaveAttribute("src", expect.stringContaining("fg=%231a2b4a"));
  });

  it("clicking Dark preset updates preview URL", async () => {
    render(<QrPanel code="test" />);
    await userEvent.click(screen.getByRole("button", { name: "Dark" }));
    const img = screen.getByRole("img", { name: "QR code preview" });
    expect(img).toHaveAttribute("src", expect.stringContaining("fg=%23ffffff"));
  });

  it("selecting PVM Logo adds logo=default to preview URL", async () => {
    render(<QrPanel code="test" />);
    await userEvent.click(screen.getByLabelText("PVM Logo"));
    const img = screen.getByRole("img", { name: "QR code preview" });
    expect(img).toHaveAttribute("src", expect.stringContaining("logo=default"));
  });

  it("upload mode shows file input after selecting Upload option", async () => {
    render(<QrPanel code="test" />);
    expect(screen.queryByLabelText("Upload logo file")).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Upload logo"));
    expect(screen.getByLabelText("Upload logo file")).toBeInTheDocument();
  });

  it("upload mode with no file shows placeholder instead of image", async () => {
    render(<QrPanel code="test" />);
    await userEvent.click(screen.getByLabelText("Upload logo"));
    expect(screen.queryByRole("img", { name: "QR code preview" })).not.toBeInTheDocument();
    expect(screen.getByText("Select a file to preview")).toBeInTheDocument();
  });
});
