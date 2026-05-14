export type ClickDisplayInput = {
  city?: string | null;
  country?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  region?: string | null;
  timezone?: string | null;
  utmCampaign?: string | null;
  utmMedium?: string | null;
  utmSource?: string | null;
};

function clean(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function formatClickLocation(click: ClickDisplayInput) {
  const parts = [clean(click.city), clean(click.region), clean(click.country)]
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : "Unknown location";
}

export function formatClickTimezone(click: ClickDisplayInput) {
  return clean(click.timezone);
}

export function formatClickCoordinates(click: ClickDisplayInput) {
  const latitude = clean(click.latitude);
  const longitude = clean(click.longitude);

  return latitude && longitude ? `${latitude}, ${longitude}` : null;
}

export function formatClickUtm(click: ClickDisplayInput) {
  const parts = [
    clean(click.utmSource),
    clean(click.utmMedium),
    clean(click.utmCampaign),
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? `UTM ${parts.join(" / ")}` : null;
}
