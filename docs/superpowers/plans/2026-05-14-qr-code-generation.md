# QR Code Generation (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a QR code download panel to the redirect detail page, serving SVG/PNG QR codes via a route handler with selectable format, size, color scheme, dot style, and logo toggle.

**Architecture:** A pure-Node SVG generator (`src/lib/qr-generator.ts`) builds QR SVGs from the `qrcode` matrix API, Sharp converts SVG→PNG for raster output, a Next.js route handler at `/api/qr/[code]` serves both formats, and a `QrPanel` client component wires up option selectors and a download anchor on the redirect detail page.

**Tech Stack:** `qrcode` (matrix data), `sharp` (SVG→PNG via WebAssembly on Vercel), React 19, Next.js App Router, Vitest + Testing Library

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the QR and image processing packages**

```bash
npm install qrcode sharp
npm install -D @types/qrcode @types/sharp
```

- [ ] **Step 2: Verify the packages resolve**

```bash
node -e "require('qrcode'); require('sharp'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add qrcode and sharp dependencies"
```

---

### Task 2: QR generator library

**Files:**
- Create: `src/lib/qr-generator.ts`
- Create: `src/lib/qr-generator.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/qr-generator.test.ts`:

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

  it("uses brand scheme fg color by default", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test" });
    expect(svg).toContain("#1a2b4a");
  });

  it("uses dark scheme colors when specified", () => {
    const svg = generateQrSvg({ url: "https://go.pvm.co.za/test", scheme: "dark" });
    expect(svg).toContain("#1a2b4a"); // bg in dark mode
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
```

- [ ] **Step 2: Run the tests — verify they fail**

```bash
npx vitest run src/lib/qr-generator.test.ts
```

Expected: FAIL — `Cannot find module './qr-generator'`

- [ ] **Step 3: Write the generator implementation**

Create `src/lib/qr-generator.ts`:

```typescript
import QRCode from "qrcode";
import sharp from "sharp";

export type QrScheme = "brand" | "light" | "dark";
export type QrDots = "square" | "rounded" | "circle";

export interface QrOptions {
  url: string;
  scheme?: QrScheme;
  dots?: QrDots;
  logo?: boolean;
  size?: number;
}

const SCHEMES: Record<QrScheme, { fg: string; bg: string }> = {
  brand: { fg: "#1a2b4a", bg: "#ffffff" },
  light: { fg: "#000000", bg: "#ffffff" },
  dark: { fg: "#ffffff", bg: "#1a2b4a" },
};

// 4 modules of quiet zone (QR spec minimum)
const QUIET = 4;

export function generateQrSvg(options: QrOptions): string {
  const { url, scheme = "brand", dots = "square", logo = false } = options;
  const { fg, bg } = SCHEMES[scheme];

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
  if (logo) {
    const center = total / 2;
    const logoSize = total * 0.22;
    const lx = center - logoSize / 2;
    const ly = center - logoSize / 2;
    const rx = logoSize * 0.12;
    const fontSize = logoSize * 0.38;
    const textY = ly + logoSize * 0.63;
    logoOverlay = `<rect x="${lx}" y="${ly}" width="${logoSize}" height="${logoSize}" rx="${rx}" fill="${bg}"/><text x="${center}" y="${textY}" text-anchor="middle" font-size="${fontSize}" font-weight="bold" font-family="system-ui,sans-serif" fill="${fg}">PVM</text>`;
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

- [ ] **Step 4: Run the tests — verify they pass**

```bash
npx vitest run src/lib/qr-generator.test.ts
```

Expected: all 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/qr-generator.ts src/lib/qr-generator.test.ts
git commit -m "feat: add QR code SVG/PNG generator"
```

---

### Task 3: API route handler

**Files:**
- Create: `src/app/api/qr/[code]/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/qr/[code]/route.ts`:

```typescript
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
    return new NextResponse(buffer, {
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/qr/[code]/route.ts
git commit -m "feat: add QR code API route handler"
```

---

### Task 4: QrPanel client component

**Files:**
- Create: `src/components/admin/QrPanel.tsx`
- Create: `src/components/admin/QrPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/admin/QrPanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { QrPanel } from "./QrPanel";

describe("QrPanel", () => {
  it("renders QR code preview image", () => {
    render(<QrPanel code="test123" />);
    const img = screen.getByRole("img", { name: "QR code preview" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("/api/qr/test123"));
  });

  it("download link uses the selected format as extension", () => {
    render(<QrPanel code="test123" />);
    const link = screen.getByRole("link", { name: /download svg/i });
    expect(link).toHaveAttribute("download", "qr-test123.svg");
  });

  it("switching to PNG changes the download filename", async () => {
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
});
```

- [ ] **Step 2: Run the tests — verify they fail**

```bash
npx vitest run src/components/admin/QrPanel.test.tsx
```

Expected: FAIL — `Cannot find module './QrPanel'`

- [ ] **Step 3: Install @testing-library/user-event if not present**

Check `package.json` devDependencies. If `@testing-library/user-event` is missing:

```bash
npm install -D @testing-library/user-event
```

- [ ] **Step 4: Write the component**

Create `src/components/admin/QrPanel.tsx`:

```tsx
"use client";

import { useState } from "react";

import { AdminCard, CardHeader } from "@/components/admin/ui";

type QrScheme = "brand" | "light" | "dark";
type QrDots = "square" | "rounded" | "circle";
type QrFormat = "svg" | "png";
type QrSize = 500 | 1000 | 2000;

const SCHEME_LABELS: Record<QrScheme, string> = {
  brand: "Brand",
  dark: "Dark",
  light: "Light",
};

const DOT_LABELS: Record<QrDots, string> = {
  circle: "Circle",
  rounded: "Rounded",
  square: "Square",
};

function RadioGroup<T extends string>({
  legend,
  name,
  onChange,
  options,
  value,
}: {
  legend: string;
  name: string;
  onChange: (v: T) => void;
  options: readonly T[];
  value: T;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--pvm-muted)]">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <label className="flex cursor-pointer items-center gap-1.5 text-sm" key={opt}>
            <input
              aria-label={opt.charAt(0).toUpperCase() + opt.slice(1)}
              checked={value === opt}
              name={name}
              onChange={() => onChange(opt)}
              type="radio"
              value={opt}
            />
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function QrPanel({ code }: Readonly<{ code: string }>) {
  const [format, setFormat] = useState<QrFormat>("svg");
  const [size, setSize] = useState<QrSize>(1000);
  const [scheme, setScheme] = useState<QrScheme>("brand");
  const [dots, setDots] = useState<QrDots>("square");
  const [logo, setLogo] = useState(false);

  const href = `/api/qr/${code}?format=${format}&size=${size}&scheme=${scheme}&dots=${dots}&logo=${logo ? 1 : 0}`;

  return (
    <AdminCard>
      <CardHeader title="QR Code" />
      <div className="flex flex-col gap-6 p-5 sm:flex-row">
        <div className="flex shrink-0 items-start justify-center">
          <div className="rounded-md border border-[var(--pvm-border)] bg-slate-50 p-3">
            <img alt="QR code preview" className="h-48 w-48" src={href} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <RadioGroup
            legend="Format"
            name="qr-format"
            onChange={setFormat}
            options={["svg", "png"] as const}
            value={format}
          />

          {format === "png" && (
            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--pvm-muted)]">
                Size (px)
              </legend>
              <div className="flex flex-wrap gap-3">
                {([500, 1000, 2000] as QrSize[]).map((s) => (
                  <label className="flex cursor-pointer items-center gap-1.5 text-sm" key={s}>
                    <input
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

          <RadioGroup
            legend="Color scheme"
            name="qr-scheme"
            onChange={setScheme}
            options={["brand", "light", "dark"] as const}
            value={scheme}
          />

          <RadioGroup
            legend="Dot style"
            name="qr-dots"
            onChange={setDots}
            options={["square", "rounded", "circle"] as const}
            value={dots}
          />

          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                checked={logo}
                onChange={(e) => setLogo(e.target.checked)}
                type="checkbox"
              />
              <span>Include PVM logo</span>
            </label>
          </div>

          <a
            className="mt-auto inline-flex w-fit items-center rounded-md bg-[var(--pvm-fg)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a3a5c]"
            download={`qr-${code}.${format}`}
            href={href}
          >
            Download {format.toUpperCase()}
          </a>
        </div>
      </div>
    </AdminCard>
  );
}
```

- [ ] **Step 5: Run the tests — verify they pass**

```bash
npx vitest run src/components/admin/QrPanel.test.tsx
```

Expected: all 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/QrPanel.tsx src/components/admin/QrPanel.test.tsx
git commit -m "feat: add QrPanel client component for redirect detail page"
```

---

### Task 5: Integrate QrPanel into redirect detail page

**Files:**
- Modify: `src/app/admin/redirects/[id]/page.tsx:176-363`

- [ ] **Step 1: Add the QrPanel import**

In `src/app/admin/redirects/[id]/page.tsx`, add to the existing imports (after the other component imports):

```typescript
import { QrPanel } from "@/components/admin/QrPanel";
```

- [ ] **Step 2: Insert QrPanel below the top-referrers card**

In the view-mode return (starting at line 176), the two-column grid section ends at approximately line 317 and the "Recent clicks" AdminCard starts. Insert the QrPanel as a new section **between** the two-column grid and the recent clicks card:

```tsx
      {/* After the closing </div> of the xl:grid-cols-[...] grid, before the recent clicks AdminCard */}
      <QrPanel code={redirect.code} />
```

The structure around line 317 looks like this — find the closing `</div>` of the grid and the opening of the "Recent clicks" card:

```tsx
      </div>  {/* ← end of xl:grid-cols grid */}

      <QrPanel code={redirect.code} />

      <AdminCard>
        <CardHeader
          actions={<span className="text-xs text-[var(--pvm-muted)]">Last 20 recorded events</span>}
          title="Recent clicks"
        />
```

- [ ] **Step 3: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/redirects/[id]/page.tsx
git commit -m "feat: add QR code panel to redirect detail page"
```

---

### Task 6: Smoke test in browser

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Navigate to a redirect detail page**

Open `http://localhost:3000/redirects/<some-id>` (or whichever route the admin is on locally).

- [ ] **Step 3: Verify QR panel renders and is scannable**

- QR panel appears below the analytics cards
- Default SVG QR code displays in the preview (no broken image)
- Switching to PNG format shows the size selector and download link updates
- Download link actually downloads a file with the correct name (`qr-<code>.svg` or `.png`)
- Switching color schemes and dot styles updates the preview

- [ ] **Step 4: Test the API directly**

In a browser or curl, hit:
- `http://localhost:3000/api/qr/<code>` → SVG response
- `http://localhost:3000/api/qr/<code>?format=png&size=500` → PNG response
- `http://localhost:3000/api/qr/nonexistent` → 404 JSON

- [ ] **Step 5: Test with a QR scanner**

Scan the generated QR code with a phone camera — it should resolve to `https://go.pvm.co.za/<code>`.
