import { describe, expect, it } from "vitest";

import {
  formatClickCoordinates,
  formatClickLocation,
  formatClickTimezone,
  formatClickUtm,
} from "./click-display";

describe("click display helpers", () => {
  it("formats available city, region, and country geo data", () => {
    expect(
      formatClickLocation({
        city: "Johannesburg",
        country: "ZA",
        region: "Gauteng",
      }),
    ).toBe("Johannesburg, Gauteng, ZA");
  });

  it("falls back gracefully when only partial geo data is available", () => {
    expect(formatClickLocation({ country: "ZA" })).toBe("ZA");
    expect(formatClickLocation({})).toBe("Unknown location");
  });

  it("formats timezone and coordinates as optional secondary details", () => {
    expect(formatClickTimezone({ timezone: "Africa/Johannesburg" })).toBe(
      "Africa/Johannesburg",
    );
    expect(
      formatClickCoordinates({ latitude: "-26.2041", longitude: "28.0473" }),
    ).toBe("-26.2041, 28.0473");
    expect(formatClickCoordinates({ latitude: "-26.2041" })).toBeNull();
  });

  it("formats UTM data in stable source, medium, campaign order", () => {
    expect(
      formatClickUtm({
        utmCampaign: "race-2026",
        utmMedium: "qr",
        utmSource: "packaging",
      }),
    ).toBe("UTM packaging / qr / race-2026");
  });
});
