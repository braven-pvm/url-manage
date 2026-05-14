"use client";

import { useId, useMemo, useState } from "react";
import { normalizeTags } from "@/lib/redirect-metadata";

type TagEditorProps = {
  defaultTags?: string[];
  helpText?: string;
  label?: string;
  name: string;
  placeholder?: string;
};

export function TagEditor({
  defaultTags = [],
  helpText = "Type a tag and press Enter. Tags are normalized for search.",
  label = "Tags",
  name,
  placeholder = "energy-bar, qr, 2026-campaign",
}: TagEditorProps) {
  const inputId = useId();
  const helpId = useId();
  const [tags, setTags] = useState(() => normalizeTags(defaultTags));
  const [draft, setDraft] = useState("");
  const hiddenValue = useMemo(() => tags.join(", "), [tags]);

  function addTags(value: string) {
    const nextTags = normalizeTags([value]);

    if (nextTags.length === 0) {
      setDraft("");
      return;
    }

    setTags((current) => [...new Set([...current, ...nextTags])]);
    setDraft("");
  }

  function removeTag(tag: string) {
    setTags((current) => current.filter((item) => item !== tag));
  }

  return (
    <div>
      <label
        className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pvm-muted)]"
        htmlFor={inputId}
      >
        {label}
      </label>
      <input name={name} type="hidden" value={hiddenValue} />
      <div className="mt-1.5 rounded-md border border-[var(--pvm-border)] bg-white px-2 py-2 transition focus-within:border-[var(--pvm-teal)] focus-within:ring-2 focus-within:ring-blue-100">
        {tags.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                className="inline-flex max-w-full items-center gap-1 rounded-md border border-[var(--pvm-border)] bg-[var(--pvm-bg)] px-2 py-1 text-xs font-medium text-[var(--pvm-fg)]"
                key={tag}
              >
                <span className="truncate">{tag}</span>
                <button
                  aria-label={`Remove ${tag}`}
                  className="rounded px-1 text-[var(--pvm-muted)] hover:bg-white hover:text-[var(--pvm-fg)]"
                  onClick={() => removeTag(tag)}
                  type="button"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <input
          aria-describedby={helpId}
          className="w-full min-w-0 bg-transparent px-1 py-1 text-sm text-[var(--pvm-fg)] outline-none placeholder:text-[var(--pvm-muted)]"
          id={inputId}
          onBlur={() => addTags(draft)}
          onChange={(event) => {
            const value = event.target.value;

            if (/[,\n;]/.test(value)) {
              addTags(value);
              return;
            }

            setDraft(value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTags(draft);
            }

            if (event.key === "Backspace" && !draft) {
              setTags((current) => current.slice(0, -1));
            }
          }}
          placeholder={placeholder}
          type="text"
          value={draft}
        />
      </div>
      <p className="mt-1 text-xs text-[var(--pvm-muted)]" id={helpId}>
        {helpText}
      </p>
    </div>
  );
}
