import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminHomePage from "./page";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/env", () => ({
  env: {
    PUBLIC_REDIRECT_HOST: "go.pvm.co.za",
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    redirect: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    redirectCategory: {
      findMany: vi.fn(),
    },
    clickEvent: {
      count: vi.fn(),
    },
  },
}));

describe("AdminHomePage", () => {
  it("uses catalog categories in filters, normalizes category filtering, and discloses capped results", async () => {
    vi.mocked(prisma.redirect.findMany)
      .mockResolvedValueOnce([{ category: "Fixed" }] as never)
      .mockResolvedValueOnce([{ tags: ["qr"] }] as never)
      .mockResolvedValueOnce([
        {
          id: "r1",
          code: "care",
          category: "Referrals",
          purpose: "Product packaging",
          tags: ["qr"],
          title: "Care",
          destinationUrl: "https://pvm.co.za/care",
          updatedAt: new Date("2026-05-13T00:00:00.000Z"),
          _count: { clickEvents: 3 },
        },
      ] as never);
    vi.mocked(prisma.redirectCategory.findMany).mockResolvedValue([
      { name: "Retail" },
    ] as never);
    vi.mocked(prisma.redirect.count)
      .mockResolvedValueOnce(237)
      .mockResolvedValueOnce(101);
    vi.mocked(prisma.clickEvent.count).mockResolvedValue(12);

    render(
      await AdminHomePage({
        searchParams: Promise.resolve({ category: "referral" }),
      }),
    );

    expect(screen.getByRole("option", { name: "Retail" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Showing 100 of 101 matching redirects. Refine search or filters to find older records.",
      ),
    ).toBeInTheDocument();
    expect(prisma.redirect.count).toHaveBeenNthCalledWith(2, {
      where: { category: "Referrals" },
    });
    expect(prisma.redirect.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        take: 100,
        where: { category: "Referrals" },
      }),
    );
  });
});
