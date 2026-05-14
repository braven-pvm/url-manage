import QRCode from "qrcode";
import sharp from "sharp";

export type QrDots = "square" | "rounded" | "circle";

export interface QrOptions {
  url: string;
  fg?: string;
  bg?: string;
  dots?: QrDots;
  logoData?: string;
  size?: number;
}

const DEFAULT_FG = "#1a2b4a";
const DEFAULT_BG = "#ffffff";
const QUIET = 4;
const LOGO_SIZE_RATIO = 0.22;
const LOGO_CORNER_RATIO = 0.12;
const LOGO_PADDING_RATIO = 0.15;

export function generateQrSvg(options: QrOptions): string {
  const { url, fg = DEFAULT_FG, bg = DEFAULT_BG, dots = "square", logoData } = options;

  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const data = qr.modules.data;
  const total = n + QUIET * 2;

  const cells: string[] = [];

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!data[row * n + col]) continue;

      const x = col + QUIET;
      const y = row + QUIET;

      if (dots === "circle") {
        cells.push(`<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.45" fill="${fg}"/>`);
      } else if (dots === "rounded") {
        cells.push(
          `<rect x="${x + 0.1}" y="${y + 0.1}" width="0.8" height="0.8" rx="0.2" fill="${fg}"/>`,
        );
      } else {
        cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fg}"/>`);
      }
    }
  }

  let logoOverlay = "";
  if (logoData) {
    const center = total / 2;
    const logoSize = total * LOGO_SIZE_RATIO;
    const lx = center - logoSize / 2;
    const ly = center - logoSize / 2;
    const rx = logoSize * LOGO_CORNER_RATIO;
    const padding = logoSize * LOGO_PADDING_RATIO;
    const innerX = lx + padding;
    const innerY = ly + padding;
    const innerSize = logoSize - padding * 2;
    const logoRect = `<rect x="${lx}" y="${ly}" width="${logoSize}" height="${logoSize}" rx="${rx}" fill="${bg}"/>`;
    const logoImage = `<image href="${logoData}" x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" preserveAspectRatio="xMidYMid meet"/>`;
    logoOverlay = `${logoRect}${logoImage}`;
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`,
    `<rect width="${total}" height="${total}" fill="${bg}"/>`,
    ...cells,
    logoOverlay,
    `</svg>`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateQrPng(options: QrOptions): Promise<Buffer> {
  const size = options.size ?? 1000;
  const svg = generateQrSvg(options);
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}
