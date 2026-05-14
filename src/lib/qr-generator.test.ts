import { describe, expect, it } from "vitest";
import { generateQrSvg } from "./qr-generator";

describe("generateQrSvg", () => {
  it("returns valid SVG markup", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test" });
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("uses brand scheme fg color by default", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test" });
    expect(svg).toContain("#1a2b4a");
  });

  it("uses dark scheme foreground color", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", scheme: "dark" });
    expect(svg).toContain('fill="#ffffff"'); // modules are white in dark scheme
  });

  it("uses circle elements for circle dot style", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", dots: "circle" });
    expect(svg).toContain("<circle");
  });

  it("uses rect elements for square dot style", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", dots: "square" });
    expect(svg).toContain("<rect");
  });

  it("includes PVM text when logo is true", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", logo: true });
    expect(svg).toContain("PVM");
  });

  it("excludes PVM text when logo is false", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", logo: false });
    expect(svg).not.toContain("PVM");
  });

  it("encodes the full URL into the QR data", () => {
    const svg1 = generateQrSvg({ url: "https://go.pvm.co.za/abc" });
    const svg2 = generateQrSvg({ url: "https://go.pvm.co.za/xyz" });
    expect(svg1).not.toBe(svg2);
  });
});
