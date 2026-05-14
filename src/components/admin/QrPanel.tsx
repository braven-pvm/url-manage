"use client";

import { useState } from "react";

import { AdminCard, CardHeader } from "@/components/admin/ui";

type QrScheme = "brand" | "light" | "dark";
type QrDots = "square" | "rounded" | "circle";
type QrFormat = "svg" | "png";
type QrSize = 500 | 1000 | 2000;

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
