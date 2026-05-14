import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { generateQrPng, generateQrSvg, type QrDots, type QrScheme } from "@/lib/qr-generator";

const VALID_SCHEMES = new Set<QrScheme>(["brand", "light", "dark"]);
const VALID_DOTS = new Set<QrDots>(["square", "rounded", "circle"]);
const VALID_SIZES = new Set([500, 1000, 2000]);

function parseScheme(value: string | null): QrScheme {
  return VALID_SCHEMES.has(value as QrScheme) ? (value as QrScheme) : "brand";
}

function parseDots(value: string | null): QrDots {
  return VALID_DOTS.has(value as QrDots) ? (value as QrDots) : "square";
}

function parseSize(value: string | null): number {
  const n = Number(value);
  return VALID_SIZES.has(n) ? n : 1000;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const { searchParams } = req.nextUrl;

  const redirect = await prisma.redirect.findUnique({
    select: { code: true },
    where: { code },
  });

  if (!redirect) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const format = searchParams.get("format") === "png" ? "png" : "svg";
  const scheme = parseScheme(searchParams.get("scheme"));
  const dots = parseDots(searchParams.get("dots"));
  const logo = searchParams.get("logo") === "1";
  const size = parseSize(searchParams.get("size"));

  const url = `https://${env.PUBLIC_REDIRECT_HOST}/${code}`;
  const options = { dots, logo, scheme, size, url };

  if (format === "png") {
    const buffer = await generateQrPng(options);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": `inline; filename="qr-${code}.png"`,
        "Content-Type": "image/png",
      },
    });
  }

  const svg = generateQrSvg(options);
  return new NextResponse(svg, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": `inline; filename="qr-${code}.svg"`,
      "Content-Type": "image/svg+xml",
    },
  });
}
