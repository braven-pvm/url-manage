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
