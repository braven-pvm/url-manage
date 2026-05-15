import { describe, expect, it } from "vitest";
import { generateQrSvg } from "./qr-generator";

const SAMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><path d="M0 0h100v50H0z" fill="#000"/></svg>';

describe("generateQrSvg", () => {
  it("returns valid SVG markup", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test" });
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("uses default fg color (#1a2b4a) when none specified", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test" });
    expect(svg).toContain("#1a2b4a");
  });

  it("applies custom fg color to modules", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", fg: "#ff0000" });
    expect(svg).toContain('fill="#ff0000"');
  });

  it("applies custom bg color to background rect", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", bg: "#cccccc" });
    expect(svg).toContain('fill="#cccccc"');
  });

  it("uses circle elements for circle dot style", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", dots: "circle" });
    expect(svg).toContain("<circle");
  });

  it("uses rect elements for square dot style", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", dots: "square" });
    expect(svg).toContain("<rect");
    expect(svg).not.toContain("<circle");
  });

  it("inlines logoSvg as a positioned group element", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", logoSvg: SAMPLE_SVG });
    expect(svg).toContain("<g transform=");
    expect(svg).toContain("scale(");
  });

  it("applies fg color to inlined logo when no logoColor specified", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", logoSvg: SAMPLE_SVG, fg: "#aabbcc" });
    expect(svg).toContain('fill="#aabbcc"');
  });

  it("applies logoColor to inlined logo independently of fg", () => {
    const svg = generateQrSvg({
      url: "https://go.pvm.co.za/test",
      logoSvg: SAMPLE_SVG,
      fg: "#111111",
      logoColor: "#ff0000",
    });
    expect(svg).toContain('fill="#ff0000"');
  });

  it("strips explicit fills from inlined SVG paths", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", logoSvg: SAMPLE_SVG, logoColor: "#ffffff" });
    // The path's original fill="#000" should be stripped; only the group fill remains
    expect(svg).not.toContain('fill="#000"');
  });

  it("renders no logo overlay when logoSvg is not provided", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test" });
    expect(svg).not.toContain("<g transform=");
  });

  it("encodes different URLs into different QR data", () => {
    const svg1 = generateQrSvg({ url: "https://go.pvm.co.za/abc" });
    const svg2 = generateQrSvg({ url: "https://go.pvm.co.za/xyz" });
    expect(svg1).not.toBe(svg2);
  });
});
