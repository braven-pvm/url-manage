import { describe, expect, it } from "vitest";
import { generateQrSvg } from "./qr-generator";

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

  it("embeds logoData as image element with preserveAspectRatio", () => {
    const logoData = "data:image/png;base64,abc123";
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", logoData });
    expect(svg).toContain("<image");
    expect(svg).toContain(logoData);
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
  });

  it("renders no image element when logoData is not provided", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test" });
    expect(svg).not.toContain("<image");
  });

  it("encodes different URLs into different QR data", () => {
    const svg1 = generateQrSvg({ url: "https://go.pvm.co.za/abc" });
    const svg2 = generateQrSvg({ url: "https://go.pvm.co.za/xyz" });
    expect(svg1).not.toBe(svg2);
  });
});
