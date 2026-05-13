import { describe, expect, it } from "vitest";

import { buildClickSeries, buildTopReferrers } from "./admin-dashboard";

describe("admin dashboard transforms", () => {
  it("builds UTC daily click counts for the requested inclusive window", () => {
    const series = buildClickSeries(
      [
        { createdAt: new Date("2026-05-12T10:00:00.000Z") },
        { createdAt: new Date("2026-05-12T11:00:00.000Z") },
        { createdAt: new Date("2026-05-13T09:00:00.000Z") },
        { createdAt: new Date("2026-05-10T23:59:59.999Z") },
      ],
      new Date("2026-05-13T12:00:00.000Z"),
      3,
    );

    expect(series).toEqual([
      { label: "2026/05/11", count: 0 },
      { label: "2026/05/12", count: 2 },
      { label: "2026/05/13", count: 1 },
    ]);
  });

  it("groups missing referrers as direct traffic and ranks the top five", () => {
    const referrers = buildTopReferrers([
      { referrerHost: null },
      { referrerHost: "" },
      { referrerHost: "instagram.com" },
      { referrerHost: "instagram.com" },
      { referrerHost: "google.com" },
      { referrerHost: "youtube.com" },
      { referrerHost: "linkedin.com" },
      { referrerHost: "braven.co.za" },
      { referrerHost: "x.com" },
    ]);

    expect(referrers).toEqual([
      { label: "Direct / No referrer", count: 2, percentage: 22 },
      { label: "instagram.com", count: 2, percentage: 22 },
      { label: "braven.co.za", count: 1, percentage: 11 },
      { label: "google.com", count: 1, percentage: 11 },
      { label: "linkedin.com", count: 1, percentage: 11 },
    ]);
  });
});
