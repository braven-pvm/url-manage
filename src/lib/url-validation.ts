export type ParseUrlResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

export function parseDestinationUrl(input: string): ParseUrlResult {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, message: "URL must start with http:// or https://" };
    }

    return { ok: true, url: url.toString() };
  } catch {
    return { ok: false, message: "Enter a valid absolute URL" };
  }
}
