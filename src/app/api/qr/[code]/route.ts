import { promises as fs } from "fs";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { generateQrPng, generateQrSvg, type QrDots } from "@/lib/qr-generator";

const CACHE_CONTROL = "public, max-age=3600";
const VALID_DOTS = new Set<QrDots>(["square", "rounded", "circle"]);
const VALID_SIZES = new Set<number>([500, 1000, 2000]);
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_LOGO_PATH = path.join(process.cwd(), "assets", "PVM.png");

function parseFg(value: string | null): string {
  return value && HEX_COLOR_RE.test(value) ? value : "#1a2b4a";
}

function parseBg(value: string | null): string {
  return value && HEX_COLOR_RE.test(value) ? value : "#ffffff";
}

function parseDots(value: string | null): QrDots {
  return VALID_DOTS.has(value as QrDots) ? (value as QrDots) : "square";
}

function parseSize(value: string | null): number {
  const n = Number(value);
  return VALID_SIZES.has(n) ? n : 1000;
}

async function readDefaultLogoData(): Promise<string> {
  const buffer = await fs.readFile(DEFAULT_LOGO_PATH);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function resolveRedirect(code: string) {
  return prisma.redirect.findUnique({ select: { code: true }, where: { code } });
}

function buildResponse(
  body: BodyInit,
  format: "svg" | "png",
  code: string,
): NextResponse {
  if (format === "png") {
    return new NextResponse(body, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "Content-Disposition": `inline; filename="qr-${code}.png"`,
        "Content-Type": "image/png",
      },
    });
  }
  return new NextResponse(body, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "Content-Disposition": `inline; filename="qr-${code}.svg"`,
      "Content-Type": "image/svg+xml",
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const redirect = await resolveRedirect(code);
  if (!redirect) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") === "png" ? "png" : "svg";
  const fg = parseFg(searchParams.get("fg"));
  const bg = parseBg(searchParams.get("bg"));
  const dots = parseDots(searchParams.get("dots"));
  const size = parseSize(searchParams.get("size"));
  const logoData =
    searchParams.get("logo") === "default" ? await readDefaultLogoData() : undefined;

  const url = `https://${env.PUBLIC_REDIRECT_HOST}/${code}`;
  const options = { bg, dots, fg, logoData, size, url };

  if (format === "png") {
    const buffer = await generateQrPng(options);
    return buildResponse(new Uint8Array(buffer), "png", code);
  }

  return buildResponse(generateQrSvg(options), "svg", code);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const redirect = await resolveRedirect(code);
  if (!redirect) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("logo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "logo file is required" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const logoData = `data:${file.type};base64,${base64}`;

  const format = formData.get("format") === "png" ? "png" : "svg";
  const fg = parseFg(formData.get("fg") as string | null);
  const bg = parseBg(formData.get("bg") as string | null);
  const dots = parseDots(formData.get("dots") as string | null);
  const size = parseSize(formData.get("size") as string | null);

  const url = `https://${env.PUBLIC_REDIRECT_HOST}/${code}`;
  const options = { bg, dots, fg, logoData, size, url };

  if (format === "png") {
    const buffer = await generateQrPng(options);
    return buildResponse(new Uint8Array(buffer), "png", code);
  }

  return buildResponse(generateQrSvg(options), "svg", code);
}
