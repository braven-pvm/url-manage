import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { QrPanel } from "./QrPanel";

const PROPS = { code: "test123", name: "Test Redirect", shortUrl: "https://go.pvm.co.za/test123" };

describe("QrPanel", () => {
  it("renders QR code preview image with api URL", () => {
    render(<QrPanel {...PROPS} />);
    const img = screen.getByRole("img", { name: "QR code preview" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("/api/qr/test123"));
  });

  it("default download link has svg extension", () => {
    render(<QrPanel {...PROPS} />);
    const link = screen.getByRole("link", { name: /download svg/i });
    expect(link).toHaveAttribute("download", "qr-test123.svg");
  });

  it("switching to PNG changes download filename", async () => {
    render(<QrPanel code="abc" name="Test" shortUrl="https://go.pvm.co.za/abc" />);
    await userEvent.click(screen.getByRole("button", { name: "PNG" }));
    const link = screen.getByRole("link", { name: /download png/i });
    expect(link).toHaveAttribute("download", "qr-abc.png");
  });

  it("Brand preset is active by default and fg included in preview URL", () => {
    render(<QrPanel {...PROPS} />);
    const img = screen.getByRole("img", { name: "QR code preview" });
    expect(img).toHaveAttribute("src", expect.stringContaining("fg=%231a2b4a"));
  });

  it("clicking Dark preset updates preview URL with Dark fg color", async () => {
    render(<QrPanel {...PROPS} />);
    await userEvent.click(screen.getByRole("button", { name: "Dark" }));
    const img = screen.getByRole("img", { name: "QR code preview" });
    expect(img).toHaveAttribute("src", expect.stringContaining("fg=%23F8FAFC"));
  });

  it("selecting PVM Logo adds logo=default to preview URL", async () => {
    render(<QrPanel {...PROPS} />);
    await userEvent.click(screen.getByRole("button", { name: /PVM Logo/i }));
    const img = screen.getByRole("img", { name: "QR code preview" });
    expect(img).toHaveAttribute("src", expect.stringContaining("logo=default"));
  });

  it("upload mode shows file input after selecting Upload option", async () => {
    render(<QrPanel {...PROPS} />);
    expect(screen.queryByLabelText("Upload logo file")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Upload$/i }));
    expect(screen.getByLabelText("Upload logo file")).toBeInTheDocument();
  });

  it("upload mode with no file shows placeholder instead of image", async () => {
    render(<QrPanel {...PROPS} />);
    await userEvent.click(screen.getByRole("button", { name: /^Upload$/i }));
    expect(screen.queryByRole("img", { name: "QR code preview" })).not.toBeInTheDocument();
    expect(screen.getByText("Select a file to preview")).toBeInTheDocument();
  });

  it("download button is disabled in upload mode before a file is selected", async () => {
    render(<QrPanel {...PROPS} />);
    await userEvent.click(screen.getByRole("button", { name: /^Upload$/i }));
    expect(screen.getByRole("button", { name: /download svg/i })).toBeDisabled();
  });

  it("shows name chip and shortUrl in header", () => {
    render(<QrPanel {...PROPS} />);
    expect(screen.getByText("Test Redirect")).toBeInTheDocument();
    expect(screen.getByText("https://go.pvm.co.za/test123")).toBeInTheDocument();
  });

  it("copy link button is present", () => {
    render(<QrPanel {...PROPS} />);
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
  });
});
