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

// ── icon components ─────────────────────────────────────────────────────────

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

function LogoBtn({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      className={`flex flex-1 items-center justify-center gap-[7px] rounded-[7px] border-[1.5px] bg-white px-2.5 py-[9px] text-[12.5px] font-medium transition-all ${
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
      <rect height="5" rx=".8" width="5" x="2" y="2" />
      <rect height="5" rx=".8" width="5" x="9" y="2" />
      <rect height="5" rx=".8" width="5" x="2" y="9" />
      <path d="M9 11.5h4M11 9.5v4" />
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

// ── main component ───────────────────────────────────────────────────────────

export function QrPanel({
  code,
  name,
  shortUrl,
}: Readonly<{ code: string; name: string; shortUrl: string }>) {
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

  // POST preview: always SVG so the <img> can render it
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

  return (
    <AdminCard className="overflow-hidden">
      {/* Yellow accent bar */}
      <div className="h-[3px] bg-[#F5C400]" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--pvm-border)] px-[22px] py-[18px]">
        <div>
          <p className="text-sm font-semibold tracking-tight">QR Code</p>
          <p className="mt-0.5 text-[11.5px] text-[var(--pvm-muted)]">{shortUrl}</p>
        </div>
        <span className="rounded-[5px] border border-[var(--pvm-border)] bg-[#F8FAFC] px-2 py-1 font-mono text-[10.5px] text-[var(--pvm-muted)]">
          {name}
        </span>
      </div>

      {/* Preview */}
      <div className="flex items-center justify-center border-b border-[var(--pvm-border)] bg-[#F8FAFC] py-[22px]">
        <div className="flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-xl border border-[var(--pvm-border)] bg-white shadow-sm">
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
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-[18px] p-[22px]">

        {/* Format */}
        <div>
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[.07em] text-[var(--pvm-muted)]">Format</p>
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

        {/* Color preset */}
        <div>
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[.07em] text-[var(--pvm-muted)]">Color Preset</p>
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
        </div>

        {/* Custom colors row */}
        {activePreset === "Custom" && (
          <div className="flex items-center gap-3 rounded-lg border border-[var(--pvm-border)] bg-[#F8FAFC] px-3.5 py-3">
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

        {/* Dot style */}
        <div>
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[.07em] text-[var(--pvm-muted)]">Dot Style</p>
          <div className="flex gap-1.5">
            {(["square", "rounded", "circle"] as QrDots[]).map((d) => (
              <button
                className={`flex flex-1 flex-col items-center gap-[7px] rounded-lg border-[1.5px] bg-white px-2 py-2.5 transition-all ${
                  dots === d
                    ? "border-[var(--pvm-fg)] bg-[rgba(13,31,53,.03)]"
                    : "border-[var(--pvm-border)] hover:border-gray-400"
                }`}
                key={d}
                onClick={() => setDots(d)}
                type="button"
              >
                <DotIcon active={dots === d} style={d} />
                <span
                  className={`text-[11.5px] font-medium ${dots === d ? "text-[var(--pvm-fg)]" : "text-[var(--pvm-muted)]"}`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Logo overlay */}
        <div>
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[.07em] text-[var(--pvm-muted)]">Logo Overlay</p>
          <div className="flex gap-1.5">
            <LogoBtn active={logoMode === "none"} onClick={() => handleLogoModeChange("none")}>
              <XIcon />
              None
            </LogoBtn>
            <LogoBtn active={logoMode === "default"} onClick={() => handleLogoModeChange("default")}>
              <PvmBadge />
              PVM Logo
            </LogoBtn>
            <LogoBtn active={logoMode === "upload"} onClick={() => handleLogoModeChange("upload")}>
              <UploadIcon />
              Upload
            </LogoBtn>
          </div>

          {logoMode !== "none" && (
            <div className="mt-2 flex flex-wrap items-center gap-4">
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
              className="mt-2 text-sm"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              type="file"
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-[var(--pvm-border)] px-[22px] py-4">
        <button
          className="flex items-center gap-1.5 rounded-[7px] border border-[var(--pvm-border)] bg-white px-4 py-2 text-[13px] font-medium shadow-sm transition hover:bg-[#F8FAFC]"
          onClick={handleCopyLink}
          type="button"
        >
          <CopyIcon />
          {copied ? "Copied!" : "Copy link"}
        </button>

        {needsButton ? (
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[7px] bg-[var(--pvm-fg)] px-4 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#1a3a5c] disabled:opacity-50"
            disabled={downloadDisabled}
            onClick={handleDownload}
            type="button"
          >
            <DownloadIcon />
            {format === "pdf" ? "Print PDF" : `Download ${format.toUpperCase()}`}
          </button>
        ) : (
          <a
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[7px] bg-[var(--pvm-fg)] px-4 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#1a3a5c]"
            download={`qr-${code}.${format}`}
            href={getHref}
          >
            <DownloadIcon />
            Download {format.toUpperCase()}
          </a>
        )}
      </div>
    </AdminCard>
  );
}
