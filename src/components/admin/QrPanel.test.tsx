import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { QrPanel } from "./QrPanel";

const PROPS = { code: "test123", name: "Test Redirect", shortUrl: "https://go.pvm.co.za/test123" };

// Mobile and desktop previews both render — pick the first one
function getPreviewImg() {
  return screen.getAllByRole("img", { name: "QR code preview" })[0];
}

describe("QrPanel", () => {
  it("renders QR code preview images with api URL", () => {
    render(<QrPanel {...PROPS} />);
    const imgs = screen.getAllByRole("img", { name: "QR code preview" });
    expect(imgs.length).toBeGreaterThanOrEqual(1);
    for (const img of imgs) {
      expect(img).toHaveAttribute("src", expect.stringContaining("/api/qr/test123"));
    }
  });

  it("default download links have svg extension", () => {
    render(<QrPanel {...PROPS} />);
    const links = screen.getAllByRole("link", { name: /download svg/i });
    for (const link of links) {
      expect(link).toHaveAttribute("download", "qr-test123.svg");
    }
  });

  it("switching to PNG changes download filename", async () => {
    render(<QrPanel code="abc" name="Test" shortUrl="https://go.pvm.co.za/abc" />);
    await userEvent.click(screen.getByRole("button", { name: "PNG" }));
    const links = screen.getAllByRole("link", { name: /download png/i });
    for (const link of links) {
      expect(link).toHaveAttribute("download", "qr-abc.png");
    }
  });

  it("Brand preset is active by default and fg included in preview URL", () => {
    render(<QrPanel {...PROPS} />);
    expect(getPreviewImg()).toHaveAttribute("src", expect.stringContaining("fg=%231a2b4a"));
  });

  it("clicking Dark preset updates preview URL with Dark fg color", async () => {
    render(<QrPanel {...PROPS} />);
    await userEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(getPreviewImg()).toHaveAttribute("src", expect.stringContaining("fg=%23F8FAFC"));
  });

  it("selecting PVM Logo adds logo=default to preview URL", async () => {
    render(<QrPanel {...PROPS} />);
    await userEvent.click(screen.getAllByRole("button", { name: /PVM Logo/i })[0]);
    expect(getPreviewImg()).toHaveAttribute("src", expect.stringContaining("logo=default"));
  });

  it("upload mode shows file input after selecting Upload option", async () => {
    render(<QrPanel {...PROPS} />);
    expect(screen.queryByLabelText("Upload logo file")).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /^Upload$/i })[0]);
    expect(screen.getAllByLabelText("Upload logo file").length).toBeGreaterThanOrEqual(1);
  });

  it("upload mode with no file shows placeholder instead of image", async () => {
    render(<QrPanel {...PROPS} />);
    await userEvent.click(screen.getAllByRole("button", { name: /^Upload$/i })[0]);
    expect(screen.queryAllByRole("img", { name: "QR code preview" })).toHaveLength(0);
    expect(screen.getAllByText("Select a file to preview").length).toBeGreaterThanOrEqual(1);
  });

  it("download button is disabled in upload mode before a file is selected", async () => {
    render(<QrPanel {...PROPS} />);
    await userEvent.click(screen.getAllByRole("button", { name: /^Upload$/i })[0]);
    const downloadBtns = screen.getAllByRole("button", { name: /download svg/i });
    for (const btn of downloadBtns) {
      expect(btn).toBeDisabled();
    }
  });

  it("shows name chip and shortUrl in header", () => {
    render(<QrPanel {...PROPS} />);
    expect(screen.getByText("Test Redirect")).toBeInTheDocument();
    expect(screen.getByText("https://go.pvm.co.za/test123")).toBeInTheDocument();
  });

  it("shows category chip when provided", () => {
    render(<QrPanel {...PROPS} category="Print / QR" />);
    expect(screen.getByText("Print / QR")).toBeInTheDocument();
  });

  it("copy link buttons are present", () => {
    render(<QrPanel {...PROPS} />);
    expect(screen.getAllByRole("button", { name: /copy link/i }).length).toBeGreaterThanOrEqual(1);
  });
});
