import Link from "next/link";
import type { ReactNode } from "react";

import { CopyButton } from "./CopyButton";

export type BadgeTone =
  | "grey"
  | "green"
  | "amber"
  | "blue"
  | "purple"
  | "red"
  | "navy";

const badgeClasses: Record<BadgeTone, string> = {
  grey: "border border-slate-200 bg-slate-100 text-slate-700",
  green: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border border-amber-200 bg-amber-50 text-amber-700",
  blue: "border border-blue-200 bg-blue-50 text-blue-700",
  purple: "border border-violet-200 bg-violet-50 text-violet-700",
  red: "border border-red-200 bg-red-50 text-red-700",
  navy: "border border-slate-300 bg-slate-100 text-[var(--pvm-fg)]",
};

type WithChildren = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export function AdminCard({ children, className = "" }: WithChildren) {
  return (
    <section
      className={`overflow-hidden rounded-lg border border-[var(--pvm-border)] bg-[var(--pvm-surface)] shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  actions,
  eyebrow,
  subtitle,
  title,
}: Readonly<{
  actions?: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
}>) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--pvm-border)] px-5 py-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--pvm-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[13px] font-bold text-[var(--pvm-fg)]">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-[11.5px] text-[var(--pvm-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: Readonly<{
  actions?: ReactNode;
  description?: string;
  eyebrow: string;
  title: string;
}>) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--pvm-muted)]">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-[22px] font-bold leading-tight text-[var(--pvm-fg)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-[13px] text-[var(--pvm-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function PrimaryLink({
  children,
  href,
}: Readonly<{ children: ReactNode; href: string }>) {
  return (
    <Link
      className="inline-flex items-center rounded-md bg-[var(--pvm-fg)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a3a5c]"
      href={href}
    >
      {children}
    </Link>
  );
}

export function SecondaryAnchor({
  children,
  href,
}: Readonly<{ children: ReactNode; href: string }>) {
  return (
    <a
      className="inline-flex items-center rounded-md border border-[var(--pvm-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--pvm-fg)] shadow-sm transition hover:border-[var(--pvm-fg)]"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

export function Badge({
  children,
  tone = "grey",
}: Readonly<{ children: ReactNode; tone?: BadgeTone }>) {
  return (
    <span
      className={`inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium leading-5 ${badgeClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function TagChip({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <span className="inline-flex max-w-full items-center truncate rounded border border-[var(--pvm-border)] bg-[var(--pvm-bg)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--pvm-muted)]">
      {children}
    </span>
  );
}

export function MetricCard({
  detail,
  label,
  value,
}: Readonly<{ detail?: string; label: string; value: string }>) {
  return (
    <AdminCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]">
            {label}
          </p>
          <p className="mt-3 text-[26px] font-bold leading-none text-[var(--pvm-fg)] tabular-nums">
            {value}
          </p>
          {detail ? (
            <p className="mt-3 text-[11.5px] text-[var(--pvm-muted)]">{detail}</p>
          ) : null}
        </div>
      </div>
    </AdminCard>
  );
}

export function UrlDisplay({
  href,
  showCopy = false,
}: Readonly<{ href: string; label?: string; showCopy?: boolean }>) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-[var(--pvm-border)] bg-[var(--pvm-bg)] px-3 py-2 font-mono text-[12.5px] text-[var(--pvm-teal)]">
      <a className="break-all hover:underline" href={href} rel="noreferrer" target="_blank">
        {href}
      </a>
      {showCopy ? (
        <CopyButton
          className="rounded border border-[var(--pvm-border)] bg-white px-2 py-1 font-sans text-[11px] font-medium text-[var(--pvm-muted)] hover:text-[var(--pvm-fg)]"
          copiedLabel="Copied"
          label="Copy"
          value={href}
        />
      ) : null}
    </div>
  );
}
