import QRCode from "qrcode";
import sharp from "sharp";

export type QrDots = "square" | "rounded" | "circle";

export interface QrOptions {
  url: string;
  fg?: string;
  bg?: string;
  dots?: QrDots;
  logoData?: string;
  logoTransparent?: boolean;
  size?: number;
}

const DEFAULT_FG = "#1a2b4a";
const DEFAULT_BG = "#ffffff";
const QUIET = 4;
const LOGO_SIZE_RATIO = 0.22;
const LOGO_CORNER_RATIO = 0.12;
const LOGO_PADDING_RATIO = 0.05;

const CIRCLE_RADIUS = 0.45;
const ROUNDED_INSET = 0.1;
const ROUNDED_SIZE = 0.8;
const ROUNDED_CORNER = 0.2;

export function generateQrSvg(options: QrOptions): string {
  const { url, fg = DEFAULT_FG, bg = DEFAULT_BG, dots = "square", logoData, logoTransparent } = options;

  if (!url) throw new Error("url is required");

  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const moduleCount = qr.modules.size;
  const data = qr.modules.data;
  const gridSize = moduleCount + QUIET * 2;

  const cells: string[] = [];

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!data[row * moduleCount + col]) continue;

      const x = col + QUIET;
      const y = row + QUIET;

      if (dots === "circle") {
        cells.push(`<circle cx="${x + 0.5}" cy="${y + 0.5}" r="${CIRCLE_RADIUS}" fill="${fg}"/>`);
      } else if (dots === "rounded") {
        cells.push(
          `<rect x="${x + ROUNDED_INSET}" y="${y + ROUNDED_INSET}" width="${ROUNDED_SIZE}" height="${ROUNDED_SIZE}" rx="${ROUNDED_CORNER}" fill="${fg}"/>`,
        );
      } else {
        cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fg}"/>`);
      }
    }
  }

  let logoOverlay = "";
  if (logoData) {
    const center = gridSize / 2;
    const logoSize = gridSize * LOGO_SIZE_RATIO;
    const logoX = center - logoSize / 2;
    const logoY = center - logoSize / 2;
    const cornerRadius = logoSize * LOGO_CORNER_RATIO;
    const padding = logoSize * LOGO_PADDING_RATIO;
    const innerX = logoX + padding;
    const innerY = logoY + padding;
    const innerSize = logoSize - padding * 2;
    const logoRect = logoTransparent
      ? ""
      : `<rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" rx="${cornerRadius}" fill="${bg}"/>`;
    const logoImage = `<image href="${logoData}" x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" preserveAspectRatio="xMidYMid meet"/>`;
    logoOverlay = `${logoRect}${logoImage}`;
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridSize} ${gridSize}" shape-rendering="crispEdges">`,
    `<rect width="${gridSize}" height="${gridSize}" fill="${bg}"/>`,
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
