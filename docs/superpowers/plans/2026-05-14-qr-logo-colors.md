# QR Code Logo & Color Customisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the QR generator's scheme/boolean-logo model with direct hex colors and a real image logo overlay, add a POST route for custom logo uploads, and rebuild QrPanel with color preset swatches, hex pickers, and a three-way logo mode selector.

**Architecture:** Three layers each updated in sequence — generator (pure functions, no I/O), route handler (I/O: filesystem + DB + request parsing), and QrPanel (React state, fetch, blob URLs). Each layer is independently testable before the next is touched.

**Tech Stack:** qrcode, sharp, Next.js App Router (GET + POST handlers), React 19, Vitest + Testing Library

---

## File Map

| File | Change |
|------|--------|
| `src/lib/qr-generator.ts` | Replace `scheme`/`logo: boolean` with `fg`/`bg`/`logoData?: string`; replace text overlay with `<image>` |
| `src/lib/qr-generator.test.ts` | Rewrite tests to match new interface |
| `src/app/api/qr/[code]/route.ts` | Add `parseFg`/`parseBg`/`readDefaultLogoData`, rewrite GET, add POST |
| `src/components/admin/QrPanel.tsx` | Add color presets + pickers, logo mode control, POST/blob preview |
| `src/components/admin/QrPanel.test.tsx` | Add tests for new color and logo controls |

---

### Task 1: Update QR generator interface and implementation

**Files:**
- Modify: `src/lib/qr-generator.ts`
- Modify: `src/lib/qr-generator.test.ts`

- [ ] **Step 1: Rewrite the failing tests first**

Replace the entire contents of `src/lib/qr-generator.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the tests — verify they fail**

```bash
npx vitest run src/lib/qr-generator.test.ts
```

Expected: several tests FAIL (interface mismatch)

- [ ] **Step 3: Rewrite the generator**

Replace the entire contents of `src/lib/qr-generator.ts`:

```typescript
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
```

- [ ] **Step 4: Run the tests — verify all pass**

```bash
npx vitest run src/lib/qr-generator.test.ts
```

Expected: 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/qr-generator.ts src/lib/qr-generator.test.ts
git commit -m "feat: replace scheme/logo-bool with fg/bg/logoData in QR generator"
```

---

### Task 2: Update route handler — GET params and new POST endpoint

**Files:**
- Modify: `src/app/api/qr/[code]/route.ts`

- [ ] **Step 1: Replace the entire route file**

```typescript
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
  body: string | Uint8Array,
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Smoke-test the GET endpoint**

With the dev server running (`npm run dev`), open in browser:

- `http://localhost:3000/api/qr/cereal?fg=%231a2b4a&bg=%23ffffff` — should render brand-colored SVG QR
- `http://localhost:3000/api/qr/cereal?fg=%23ffffff&bg=%231a2b4a&dots=circle` — should render dark circle-dot QR
- `http://localhost:3000/api/qr/cereal?logo=default` — should render QR with PVM logo in center
- `http://localhost:3000/api/qr/nonexistent` — should return `{"error":"Not found"}`

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/qr/[code]/route.ts"
git commit -m "feat: replace scheme with fg/bg params, add POST for custom logo"
```

---

### Task 3: Update QrPanel and its tests

**Files:**
- Modify: `src/components/admin/QrPanel.tsx`
- Modify: `src/components/admin/QrPanel.test.tsx`

- [ ] **Step 1: Rewrite the tests first**

Replace the entire contents of `src/components/admin/QrPanel.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/components/admin/QrPanel.test.tsx
```

Expected: several FAIL (interface mismatch, missing elements)

- [ ] **Step 3: Rewrite the QrPanel component**

Replace the entire contents of `src/components/admin/QrPanel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

import { AdminCard, CardHeader } from "@/components/admin/ui";

type QrDots = "square" | "rounded" | "circle";
type QrFormat = "svg" | "png";
type QrSize = 500 | 1000 | 2000;
type LogoMode = "none" | "default" | "upload";

const PRESETS = [
  { bg: "#ffffff", fg: "#1a2b4a", label: "Brand" },
  { bg: "#ffffff", fg: "#000000", label: "Light" },
  { bg: "#1a2b4a", fg: "#ffffff", label: "Dark" },
  { bg: "#000000", fg: "#ffffff", label: "Inverted" },
] as const;

function buildGetHref(
  code: string,
  format: QrFormat,
  size: QrSize,
  fg: string,
  bg: string,
  dots: QrDots,
  logoMode: LogoMode,
): string {
  const params = new URLSearchParams({ bg, dots, fg, format, size: String(size) });
  if (logoMode === "default") params.set("logo", "default");
  return `/api/qr/${code}?${params.toString()}`;
}

async function postQr(
  code: string,
  file: File,
  format: QrFormat,
  size: QrSize,
  fg: string,
  bg: string,
  dots: QrDots,
): Promise<Blob> {
  const form = new FormData();
  form.append("bg", bg);
  form.append("dots", dots);
  form.append("fg", fg);
  form.append("format", format);
  form.append("logo", file);
  form.append("size", String(size));
  const res = await fetch(`/api/qr/${code}`, { body: form, method: "POST" });
  return res.blob();
}

export function QrPanel({ code }: Readonly<{ code: string }>) {
  const [format, setFormat] = useState<QrFormat>("svg");
  const [size, setSize] = useState<QrSize>(1000);
  const [fg, setFg] = useState("#1a2b4a");
  const [bg, setBg] = useState("#ffffff");
  const [activePreset, setActivePreset] = useState<string | null>("Brand");
  const [dots, setDots] = useState<QrDots>("square");
  const [logoMode, setLogoMode] = useState<LogoMode>("none");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // POST mode: refetch blob whenever upload-related state changes
  useEffect(() => {
    if (logoMode !== "upload" || !logoFile) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);

    postQr(code, logoFile, format, size, fg, bg, dots)
      .then((blob) => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return objectUrl;
        });
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [logoMode, logoFile, format, size, fg, bg, dots, code]);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setFg(preset.fg);
    setBg(preset.bg);
    setActivePreset(preset.label);
  }

  function handleLogoModeChange(mode: LogoMode) {
    setLogoMode(mode);
    if (mode !== "upload") setLogoFile(null);
  }

  async function handleDownload() {
    if (!logoFile) return;
    const blob = await postQr(code, logoFile, format, size, fg, bg, dots);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${code}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isUploadMode = logoMode === "upload";
  const isUploadReady = isUploadMode && !!logoFile;
  const getHref = buildGetHref(code, format, size, fg, bg, dots, logoMode);
  const previewSrc = isUploadMode ? blobUrl : getHref;

  return (
    <AdminCard>
      <CardHeader title="QR Code" />
      <div className="flex flex-col gap-6 p-5 sm:flex-row">
        {/* Preview */}
        <div className="flex shrink-0 items-start justify-center">
          <div className="rounded-md border border-[var(--pvm-border)] bg-slate-50 p-3">
            {isUploadMode && !logoFile ? (
              <div className="flex h-48 w-48 items-center justify-center text-center text-xs text-[var(--pvm-muted)]">
                Select a file to preview
              </div>
            ) : (
              <img
                alt="QR code preview"
                className={`h-48 w-48 transition-opacity ${previewLoading ? "opacity-50" : "opacity-100"}`}
                src={previewSrc ?? ""}
              />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Format */}
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--pvm-muted)]">
              Format
            </legend>
            <div className="flex flex-wrap gap-3">
              {(["svg", "png"] as QrFormat[]).map((f) => (
                <label className="flex cursor-pointer items-center gap-1.5 text-sm" key={f}>
                  <input
                    aria-label={f.toUpperCase()}
                    checked={format === f}
                    name="qr-format"
                    onChange={() => setFormat(f)}
                    type="radio"
                    value={f}
                  />
                  {f.toUpperCase()}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Size (PNG only) */}
          {format === "png" && (
            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--pvm-muted)]">
                Size (px)
              </legend>
              <div className="flex flex-wrap gap-3">
                {([500, 1000, 2000] as QrSize[]).map((s) => (
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm" key={s}>
                    <input
                      aria-label={`${s}px`}
                      checked={size === s}
                      name="qr-size"
                      onChange={() => setSize(s)}
                      type="radio"
                      value={s}
                    />
                    {s}px
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* Colors */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--pvm-muted)]">
              Colors
            </p>
            <div className="mb-2 flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  className={`rounded-md border-2 px-3 py-1 text-xs font-semibold transition ${
                    activePreset === preset.label
                      ? "border-[var(--pvm-fg)]"
                      : "border-[var(--pvm-border)] hover:border-[var(--pvm-fg)]"
                  }`}
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  style={{ backgroundColor: preset.bg, color: preset.fg }}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-[var(--pvm-muted)]">Foreground</span>
                <input
                  aria-label="Foreground color"
                  className="h-8 w-12 cursor-pointer rounded border border-[var(--pvm-border)]"
                  onChange={(e) => { setFg(e.target.value); setActivePreset(null); }}
                  type="color"
                  value={fg}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-[var(--pvm-muted)]">Background</span>
                <input
                  aria-label="Background color"
                  className="h-8 w-12 cursor-pointer rounded border border-[var(--pvm-border)]"
                  onChange={(e) => { setBg(e.target.value); setActivePreset(null); }}
                  type="color"
                  value={bg}
                />
              </label>
            </div>
          </div>

          {/* Dot style */}
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--pvm-muted)]">
              Dot style
            </legend>
            <div className="flex flex-wrap gap-3">
              {(["square", "rounded", "circle"] as QrDots[]).map((d) => (
                <label className="flex cursor-pointer items-center gap-1.5 text-sm" key={d}>
                  <input
                    aria-label={d.charAt(0).toUpperCase() + d.slice(1)}
                    checked={dots === d}
                    name="qr-dots"
                    onChange={() => setDots(d)}
                    type="radio"
                    value={d}
                  />
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Logo */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--pvm-muted)]">
              Logo
            </p>
            <div className="flex gap-3">
              {(
                [
                  { label: "None", mode: "none" as LogoMode, ariaLabel: "No logo" },
                  { label: "PVM Logo", mode: "default" as LogoMode, ariaLabel: "PVM Logo" },
                  { label: "Upload", mode: "upload" as LogoMode, ariaLabel: "Upload logo" },
                ] as const
              ).map(({ label, mode, ariaLabel }) => (
                <label className="flex cursor-pointer items-center gap-1.5 text-sm" key={mode}>
                  <input
                    aria-label={ariaLabel}
                    checked={logoMode === mode}
                    name="qr-logo"
                    onChange={() => handleLogoModeChange(mode)}
                    type="radio"
                    value={mode}
                  />
                  {label}
                </label>
              ))}
            </div>
            {logoMode === "upload" && (
              <input
                accept="image/png,image/jpeg,image/svg+xml"
                aria-label="Upload logo file"
                className="mt-2 text-sm"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                type="file"
              />
            )}
          </div>

          {/* Download */}
          {isUploadMode ? (
            <button
              className="mt-auto inline-flex w-fit items-center rounded-md bg-[var(--pvm-fg)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a3a5c] disabled:opacity-50"
              disabled={!isUploadReady}
              onClick={handleDownload}
              type="button"
            >
              Download {format.toUpperCase()}
            </button>
          ) : (
            <a
              className="mt-auto inline-flex w-fit items-center rounded-md bg-[var(--pvm-fg)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a3a5c]"
              download={`qr-${code}.${format}`}
              href={getHref}
            >
              Download {format.toUpperCase()}
            </a>
          )}
        </div>
      </div>
    </AdminCard>
  );
}
```

- [ ] **Step 4: Run the tests — verify all pass**

```bash
npx vitest run src/components/admin/QrPanel.test.tsx
```

Expected: all 9 tests PASS

- [ ] **Step 5: Run the full suite**

```bash
npx vitest run
```

Expected: all tests PASS (generator + panel + all other tests)

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/QrPanel.tsx src/components/admin/QrPanel.test.tsx
git commit -m "feat: add color presets, hex pickers, and logo upload to QrPanel"
```

---

### Task 4: Smoke test in browser

**Files:** none

- [ ] **Step 1: Start dev server if not running**

```bash
npm run dev
```

- [ ] **Step 2: Navigate to a redirect detail page**

Sign in and open any redirect detail page. The QR panel should appear with the updated controls.

- [ ] **Step 3: Verify color controls**

- Brand swatch is active by default — preview shows navy QR on white
- Click "Dark" swatch — preview updates to white QR on navy
- Click "Inverted" — preview updates to white QR on black
- Change the Foreground color picker to red — swatch deselects, preview updates

- [ ] **Step 4: Verify logo controls**

- "PVM Logo" — preview shows QR with the actual PVM logo centered and letterboxed
- "None" — logo disappears from preview

- [ ] **Step 5: Verify upload (use any small PNG/JPG from your system)**

- Select "Upload" — file input appears
- Choose a file — preview loads with the uploaded logo in the center
- "Download SVG" button (not anchor) appears and is enabled
- Click Download — file downloads with correct name

- [ ] **Step 6: Push**

```bash
git push origin main
```
