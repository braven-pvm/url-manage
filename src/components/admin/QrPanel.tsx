"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { AdminCard } from "@/components/admin/ui";

type QrDots = "square" | "rounded" | "circle";
type QrFormat = "svg" | "png" | "pdf";
type LogoMode = "none" | "default" | "upload";

const PRESETS: Array<{ label: string; bg: string | null; fg: string | null }> = [
  { label: "Brand", bg: "#ffffff", fg: "#1a2b4a" },
  { label: "Light", bg: "#F8FAFC", fg: "#374151" },
  { label: "Dark", bg: "#111827", fg: "#F8FAFC" },
  { label: "Inverted", bg: "#1a2b4a", fg: "#ffffff" },
  { label: "Custom", bg: null, fg: null },
];

const DOWNLOAD_HINTS: Record<QrFormat, string> = {
  svg: "Print-ready · vector · 4mm quiet zone",
  png: "Raster · 1000 px · 4mm quiet zone",
  pdf: "A4 PDF · print-ready · 4mm quiet zone",
};

function swatchBg(label: string): string {
  switch (label) {
    case "Brand": return "#1a2b4a";
    case "Light": return "#F8FAFC";
    case "Dark": return "#111827";
    case "Inverted": return "linear-gradient(135deg,#ffffff 50%,#1a2b4a 50%)";
    case "Custom": return "conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)";
    default: return "#ffffff";
  }
}

function buildGetHref(
  code: string,
  format: "svg" | "png",
  fg: string,
  bg: string,
  dots: QrDots,
  logoMode: LogoMode,
  logoColor: string,
  logoTransparent: boolean,
): string {
  const params = new URLSearchParams({ bg, dots, fg, format, size: "1000" });
  if (logoMode === "default") params.set("logo", "default");
  if (logoMode !== "none") {
    params.set("logoColor", logoColor);
    if (logoTransparent) params.set("logoBg", "none");
  }
  return `/api/qr/${code}?${params.toString()}`;
}

async function postQr(
  code: string,
  file: File,
  format: "svg" | "png",
  fg: string,
  bg: string,
  dots: QrDots,
  logoColor: string,
  logoTransparent: boolean,
): Promise<Blob> {
  const form = new FormData();
  form.append("bg", bg);
  form.append("dots", dots);
  form.append("fg", fg);
  form.append("format", format);
  form.append("logo", file);
  form.append("logoColor", logoColor);
  form.append("size", "1000");
  if (logoTransparent) form.append("logoBg", "none");
  const res = await fetch(`/api/qr/${code}`, { body: form, method: "POST" });
  return res.blob();
}

function openPrintWindow(imgSrc: string, onDone?: () => void) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(
    `<!doctype html><html><head><style>
    @page{size:A4;margin:20mm}
    body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}
    img{width:150mm;height:150mm}
    p{margin-top:8mm;font-size:11pt;color:#666}
    </style></head><body>
    <img src="${imgSrc}" onload="window.print()">
    </body></html>`,
  );
  win.document.close();
  if (onDone) win.addEventListener("afterprint", onDone);
}

// ── icon components ──────────────────────────────────────────────────────────

function DotIcon({ style, active }: { style: QrDots; active: boolean }) {
  const fill = active ? "var(--pvm-fg)" : "#6B7280";
  if (style === "circle") {
    return (
      <svg fill="none" height="36" viewBox="0 0 36 36" width="36">
        {[7, 18, 29].flatMap((cx) => [7, 18, 29].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} fill={fill} r="3" />))}
      </svg>
    );
  }
  const rx = style === "rounded" ? "2" : "0";
  return (
    <svg fill="none" height="36" viewBox="0 0 36 36" width="36">
      {[4, 15, 26].flatMap((x) => [4, 15, 26].map((y) => <rect key={`${x}-${y}`} fill={fill} height="6" rx={rx} width="6" x={x} y={y} />))}
    </svg>
  );
}

// Logo option button — `grow` makes it flex-1 for the mobile row layout
function LogoBtn({
  active,
  children,
  grow,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  grow?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex items-center justify-center gap-[7px] rounded-[7px] border-[1.5px] bg-white px-2.5 py-[9px] text-[12.5px] font-medium transition-all ${grow ? "flex-1" : "w-full"} ${
        active
          ? "border-[var(--pvm-fg)] bg-[rgba(13,31,53,.03)] text-[var(--pvm-fg)]"
          : "border-[var(--pvm-border)] text-[var(--pvm-muted)] hover:border-gray-400"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function XIcon() {
  return (
    <svg fill="none" height="14" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16" width="14">
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}

function PvmBadge() {
  return (
    <span
      style={{
        alignItems: "center",
        background: "#1a2b4a",
        borderRadius: 3,
        color: "#F5C400",
        display: "inline-flex",
        flexShrink: 0,
        fontSize: 8,
        fontWeight: 800,
        height: 16,
        justifyContent: "center",
        width: 16,
      }}
    >
      P
    </span>
  );
}

function UploadIcon() {
  return (
    <svg fill="none" height="14" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16" width="14">
      <path d="M8 11V3M5 6l3-3 3 3" />
      <path d="M3 13h10" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg fill="none" height="13" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16" width="13">
      <rect height="8" rx="1" width="8" x="6" y="6" />
      <path d="M4 10H3a1 1 0 01-1-1V3a1 1 0 011-1h6a1 1 0 011 1v1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg fill="none" height="13" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 16 16" width="13">
      <path d="M8 3v7M5 8l3 3 3-3" />
      <path d="M3 13h10" />
    </svg>
  );
}

// ── section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[.07em] text-[var(--pvm-muted)]">
      {children}
    </p>
  );
}

// ── main component ───────────────────────────────────────────────────────────

export function QrPanel({
  category,
  code,
  name,
  shortUrl,
}: Readonly<{ category?: string; code: string; name: string; shortUrl: string }>) {
  const [format, setFormat] = useState<QrFormat>("svg");
  const [fg, setFg] = useState("#1a2b4a");
  const [bg, setBg] = useState("#ffffff");
  const [activePreset, setActivePreset] = useState("Brand");
  const [dots, setDots] = useState<QrDots>("square");
  const [logoMode, setLogoMode] = useState<LogoMode>("none");
  const [logoColor, setLogoColor] = useState("#1a2b4a");
  const [logoTransparent, setLogoTransparent] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const latestBlobUrl = useRef<string | null>(null);

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
    postQr(code, logoFile, "svg", fg, bg, dots, logoColor, logoTransparent)
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logoMode, logoFile, fg, bg, dots, logoColor, logoTransparent, code]);

  useEffect(() => {
    latestBlobUrl.current = blobUrl;
  }, [blobUrl]);

  useEffect(
    () => () => {
      if (latestBlobUrl.current) URL.revokeObjectURL(latestBlobUrl.current);
    },
    [],
  );

  function applyPreset(label: string, presetFg: string | null, presetBg: string | null) {
    setActivePreset(label);
    if (presetFg && presetBg) {
      setFg(presetFg);
      setBg(presetBg);
      setLogoColor(presetFg);
    }
  }

  function handleLogoModeChange(mode: LogoMode) {
    setLogoMode(mode);
    if (mode !== "upload") setLogoFile(null);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  async function handleDownload() {
    if (format === "pdf") {
      if (isUploadMode && logoFile) {
        const svgBlob = await postQr(code, logoFile, "svg", fg, bg, dots, logoColor, logoTransparent);
        const objUrl = URL.createObjectURL(svgBlob);
        openPrintWindow(objUrl, () => URL.revokeObjectURL(objUrl));
      } else {
        openPrintWindow(buildGetHref(code, "svg", fg, bg, dots, logoMode, logoColor, logoTransparent));
      }
      return;
    }
    if (!logoFile) return;
    const blob = await postQr(code, logoFile, format, fg, bg, dots, logoColor, logoTransparent);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${code}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isUploadMode = logoMode === "upload";
  const isUploadReady = isUploadMode && !!logoFile;
  const apiFormat = format === "pdf" ? "svg" : format;
  const getHref = buildGetHref(code, apiFormat, fg, bg, dots, logoMode, logoColor, logoTransparent);
  const previewSrc = isUploadMode ? blobUrl : getHref;
  const needsButton = format === "pdf" || isUploadMode;
  const downloadDisabled = isUploadMode && !isUploadReady && format !== "pdf";
  const displayUrl = shortUrl.replace(/^https?:\/\//, "");

  // ── shared sub-sections (used in both mobile & desktop) ──────────────────

  const formatControl = (
    <div>
      <SectionLabel>Download Format</SectionLabel>
      <div className="inline-flex gap-0.5 rounded-[7px] border border-[var(--pvm-border)] bg-[#EEF1F5] p-[3px]">
        {(["svg", "png", "pdf"] as QrFormat[]).map((f) => (
          <button
            className={`rounded-[5px] px-3.5 py-[5px] text-[12.5px] font-medium leading-none transition-all ${
              format === f
                ? "bg-white text-[var(--pvm-fg)] shadow-sm ring-1 ring-black/[.06]"
                : "text-[var(--pvm-muted)] hover:text-[var(--pvm-fg)]"
            }`}
            key={f}
            onClick={() => setFormat(f)}
            type="button"
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  const colorScheme = (
    <div>
      <SectionLabel>Color Scheme</SectionLabel>
      <div className="flex gap-1.5">
        {PRESETS.map((preset) => (
          <button
            className="flex flex-col items-center gap-[5px]"
            key={preset.label}
            onClick={() => applyPreset(preset.label, preset.fg, preset.bg)}
            type="button"
          >
            <div
              className={`relative h-11 w-11 rounded-[9px] border-2 transition-all ${
                activePreset === preset.label
                  ? "border-[var(--pvm-fg)] shadow-[0_0_0_3px_rgba(26,43,74,.12)]"
                  : "border-transparent"
              }`}
              style={{ background: swatchBg(preset.label) }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-[7px] border border-black/[.08]" />
            </div>
            <span
              className={`text-[11px] font-medium ${
                activePreset === preset.label ? "text-[var(--pvm-fg)]" : "text-[var(--pvm-muted)]"
              }`}
            >
              {preset.label}
            </span>
          </button>
        ))}
      </div>

      {activePreset === "Custom" && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-[var(--pvm-border)] bg-[#F8FAFC] px-3.5 py-3">
          <div className="flex flex-1 items-center gap-2">
            <span className="text-xs text-[var(--pvm-muted)]">Foreground</span>
            <div className="h-[30px] w-9 overflow-hidden rounded-md border-[1.5px] border-[var(--pvm-border)]">
              <input
                aria-label="Foreground color"
                className="-m-[7px] h-[44px] w-[50px] cursor-pointer border-none bg-transparent"
                onChange={(e) => setFg(e.target.value)}
                type="color"
                value={fg}
              />
            </div>
          </div>
          <span className="text-lg text-[var(--pvm-border)]">·</span>
          <div className="flex flex-1 items-center gap-2">
            <span className="text-xs text-[var(--pvm-muted)]">Background</span>
            <div className="h-[30px] w-9 overflow-hidden rounded-md border-[1.5px] border-[var(--pvm-border)]">
              <input
                aria-label="Background color"
                className="-m-[7px] h-[44px] w-[50px] cursor-pointer border-none bg-transparent"
                onChange={(e) => setBg(e.target.value)}
                type="color"
                value={bg}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const dotStyle = (
    <div>
      <SectionLabel>Dot Style</SectionLabel>
      <div className="grid grid-cols-3 gap-1.5 max-w-[360px]">
        {(["square", "rounded", "circle"] as QrDots[]).map((d) => (
          <button
            className={`flex flex-col items-center gap-[7px] rounded-lg border-[1.5px] bg-white px-2 py-2.5 transition-all ${
              dots === d
                ? "border-[var(--pvm-fg)] bg-[rgba(13,31,53,.03)]"
                : "border-[var(--pvm-border)] hover:border-gray-400"
            }`}
            key={d}
            onClick={() => setDots(d)}
            type="button"
          >
            <DotIcon active={dots === d} style={d} />
            <span className={`text-[11.5px] font-medium ${dots === d ? "text-[var(--pvm-fg)]" : "text-[var(--pvm-muted)]"}`}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // Logo buttons — `grow` prop controls flex-1 (mobile row) vs w-full (desktop col)
  const logoButtons = (grow: boolean) => (
    <>
      <LogoBtn active={logoMode === "none"} grow={grow} onClick={() => handleLogoModeChange("none")}>
        <XIcon />
        None
      </LogoBtn>
      <LogoBtn active={logoMode === "default"} grow={grow} onClick={() => handleLogoModeChange("default")}>
        <PvmBadge />
        PVM Logo
      </LogoBtn>
      <LogoBtn active={logoMode === "upload"} grow={grow} onClick={() => handleLogoModeChange("upload")}>
        <UploadIcon />
        Upload
      </LogoBtn>
    </>
  );

  const logoExtras = (
    <>
      {logoMode !== "none" && (
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--pvm-muted)]">Logo color</span>
            <div className="h-[30px] w-9 overflow-hidden rounded-md border-[1.5px] border-[var(--pvm-border)]">
              <input
                aria-label="Logo color"
                className="-m-[7px] h-[44px] w-[50px] cursor-pointer border-none bg-transparent"
                onChange={(e) => setLogoColor(e.target.value)}
                type="color"
                value={logoColor}
              />
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              checked={logoTransparent}
              onChange={(e) => setLogoTransparent(e.target.checked)}
              type="checkbox"
            />
            <span>Transparent background</span>
          </label>
        </div>
      )}
      {logoMode === "upload" && (
        <input
          accept="image/svg+xml"
          aria-label="Upload logo file"
          className="text-sm"
          onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          type="file"
        />
      )}
    </>
  );

  const copyBtn = (full?: boolean) => (
    <button
      className={`flex items-center gap-1.5 rounded-[7px] border border-[var(--pvm-border)] bg-white px-4 py-2 text-[13px] font-medium shadow-sm transition hover:bg-[#F8FAFC] ${full ? "w-full justify-center" : ""}`}
      onClick={handleCopyLink}
      type="button"
    >
      <CopyIcon />
      {copied ? "Copied!" : "Copy link"}
    </button>
  );

  const downloadBtn = (full?: boolean) => needsButton ? (
    <button
      className={`flex items-center gap-1.5 rounded-[7px] bg-[var(--pvm-fg)] px-4 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#1a3a5c] disabled:opacity-50 ${full ? "w-full justify-center" : "flex-1 justify-center"}`}
      disabled={downloadDisabled}
      onClick={handleDownload}
      type="button"
    >
      <DownloadIcon />
      {format === "pdf" ? "Print PDF" : `Download ${format.toUpperCase()}`}
    </button>
  ) : (
    <a
      className={`flex items-center gap-1.5 rounded-[7px] bg-[var(--pvm-fg)] px-4 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#1a3a5c] ${full ? "w-full justify-center" : "flex-1 justify-center"}`}
      download={`qr-${code}.${format}`}
      href={getHref}
    >
      <DownloadIcon />
      Download {format.toUpperCase()}
    </a>
  );

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <AdminCard className="overflow-hidden">
      {/* Accent bar */}
      <div className="h-[3px] bg-[#F5C400]" />

      {/* Header */}
      <div className="flex items-start justify-between border-b border-[var(--pvm-border)] px-6 py-4">
        <div>
          <p className="font-semibold">QR Code</p>
          <p className="mt-0.5 text-[11.5px] text-[var(--pvm-muted)]">
            <span className="lg:hidden">{shortUrl}</span>
            <span className="hidden lg:inline">Stable code for packaging and print — destination updates automatically</span>
          </p>
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-2">
          {/* Mobile: name chip */}
          <span className="rounded-[5px] border border-[var(--pvm-border)] bg-[#F8FAFC] px-2 py-1 font-mono text-[10.5px] text-[var(--pvm-muted)] lg:hidden">
            {name}
          </span>
          {/* Desktop: category + URL chips */}
          {category && (
            <span className="hidden rounded-[5px] border border-[var(--pvm-border)] bg-[#F8FAFC] px-2 py-1 text-[10.5px] text-[var(--pvm-muted)] lg:inline-block">
              {category}
            </span>
          )}
          <span className="hidden rounded-[5px] border border-[var(--pvm-border)] bg-[#F8FAFC] px-2 py-1 font-mono text-[10.5px] text-[var(--pvm-muted)] lg:inline-block">
            {displayUrl}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row lg:divide-x lg:divide-[var(--pvm-border)]">

        {/* Left col: QR preview */}
        <div className="flex flex-col items-center justify-center border-b border-[var(--pvm-border)] bg-[#F8FAFC] py-6 lg:w-[360px] lg:border-b-0 lg:bg-transparent lg:p-0">
          {/* Mobile: framed preview */}
          <div className="flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-xl border border-[var(--pvm-border)] bg-white shadow-sm lg:hidden">
            {isUploadMode && !logoFile ? (
              <p className="text-center text-xs text-[var(--pvm-muted)]">Select a file to preview</p>
            ) : (
              <img
                alt="QR code preview"
                className={`h-[140px] w-[140px] transition-opacity ${previewLoading ? "opacity-50" : "opacity-100"}`}
                src={previewSrc ?? ""}
              />
            )}
          </div>

          {/* Desktop: fills the column */}
          <div className="hidden w-full lg:block">
            {isUploadMode && !logoFile ? (
              <div className="flex aspect-square w-full items-center justify-center border-[var(--pvm-border)] bg-[#F8FAFC]">
                <p className="text-center text-xs text-[var(--pvm-muted)]">Select a file<br />to preview</p>
              </div>
            ) : (
              <img
                alt="QR code preview"
                className={`aspect-square w-full object-contain transition-opacity ${previewLoading ? "opacity-50" : "opacity-100"}`}
                src={previewSrc ?? ""}
              />
            )}
            <p className="border-t border-[var(--pvm-border)] py-2 text-center text-[11.5px] text-[var(--pvm-muted)]">{displayUrl}</p>
          </div>
        </div>

        {/* Middle col: controls */}
        <div className="flex flex-1 flex-col gap-5 border-b border-[var(--pvm-border)] p-6 lg:border-b-0">
          {formatControl}
          {colorScheme}
          {dotStyle}

          {/* Mobile-only: logo overlay */}
          <div className="lg:hidden">
            <SectionLabel>Logo Overlay</SectionLabel>
            <div className="flex gap-1.5">
              {logoButtons(true)}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {logoExtras}
            </div>
          </div>
        </div>

        {/* Right col: logo + actions (desktop only) */}
        <div className="hidden lg:flex lg:w-[220px] lg:flex-col lg:gap-2 lg:p-6">
          <SectionLabel>Logo Overlay</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {logoButtons(false)}
          </div>
          <div className="mt-1 flex flex-col gap-2">
            {logoExtras}
          </div>

          <div className="mt-auto flex flex-col gap-2 border-t border-[var(--pvm-border)] pt-4">
            {copyBtn(true)}
            {downloadBtn(true)}
            <p className="text-center text-[10.5px] text-[var(--pvm-muted)]">{DOWNLOAD_HINTS[format]}</p>
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="flex items-center gap-2 border-t border-[var(--pvm-border)] px-6 py-4 lg:hidden">
        {copyBtn()}
        {downloadBtn()}
      </div>
    </AdminCard>
  );
}
