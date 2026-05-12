import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getRedirectDestination,
  logClickBestEffort,
} from "@/lib/redirect-service";
import { getGlobalFallbackUrl } from "@/lib/settings-service";
import { GET, getIpHashSalt, hashIp } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: { test: "prisma" },
}));

vi.mock("@/lib/redirect-service", () => ({
  getRedirectDestination: vi.fn(),
  logClickBestEffort: vi.fn(),
}));

vi.mock("@/lib/settings-service", () => ({
  getGlobalFallbackUrl: vi.fn(),
}));

const getRedirectDestinationMock = vi.mocked(getRedirectDestination);
const getGlobalFallbackUrlMock = vi.mocked(getGlobalFallbackUrl);
const logClickBestEffortMock = vi.mocked(logClickBestEffort);

describe("public redirect route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.IP_HASH_SALT;
  });

  it("redirects matched codes and logs click metadata", async () => {
    process.env.IP_HASH_SALT = "test-salt";
    getRedirectDestinationMock.mockResolvedValue({
      found: true,
      redirectId: "redirect-1",
      code: "care",
      destinationUrl: "https://shop.pvm.co.za/care",
    });

    const response = await GET(
      new NextRequest("https://go.pvm.co.za/Care", {
        headers: {
          referer: "https://referrer.example/",
          "user-agent": "Vitest Browser",
          "x-forwarded-for": "203.0.113.10, 198.51.100.2",
          "x-real-ip": "198.51.100.9",
        },
      }),
      { params: Promise.resolve({ code: "Care" }) },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://shop.pvm.co.za/care");
    expect(getRedirectDestination).toHaveBeenCalledWith(prisma, "Care");
    expect(getGlobalFallbackUrl).not.toHaveBeenCalled();
    expect(logClickBestEffortMock).toHaveBeenCalledWith(prisma, {
      redirectId: "redirect-1",
      requestedCode: "care",
      outcome: "matched",
      referrer: "https://referrer.example/",
      userAgent: "Vitest Browser",
      ipHash: createHash("sha256")
        .update("test-salt:203.0.113.10")
        .digest("hex"),
    });
  });

  it("redirects missing or malformed codes to fallback and logs fallback outcome", async () => {
    getRedirectDestinationMock.mockResolvedValue({
      found: false,
      code: "../admin",
    });
    getGlobalFallbackUrlMock.mockResolvedValue("https://www.pvm.co.za/");

    const response = await GET(
      new NextRequest("https://go.pvm.co.za/../admin", {
        headers: {
          "user-agent": "Vitest Browser",
          "x-real-ip": "198.51.100.9",
        },
      }),
      { params: Promise.resolve({ code: "../admin" }) },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://www.pvm.co.za/");
    expect(getGlobalFallbackUrl).toHaveBeenCalledWith(prisma);
    expect(logClickBestEffortMock).toHaveBeenCalledWith(prisma, {
      redirectId: null,
      requestedCode: "../admin",
      outcome: "fallback",
      referrer: null,
      userAgent: "Vitest Browser",
      ipHash: createHash("sha256")
        .update("pvm-url-local:198.51.100.9")
        .digest("hex"),
    });
  });
});

describe("hashIp", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete process.env.IP_HASH_SALT;
    vi.stubEnv("NODE_ENV", originalNodeEnv);
  });

  it("returns null for empty IP values", () => {
    expect(hashIp(null)).toBeNull();
    expect(hashIp("")).toBeNull();
  });

  it("hashes the salted IP address", () => {
    process.env.IP_HASH_SALT = "test-salt";

    expect(hashIp("203.0.113.10")).toBe(
      createHash("sha256").update("test-salt:203.0.113.10").digest("hex"),
    );
  });

  it("requires a configured salt in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getIpHashSalt()).toThrow("IP_HASH_SALT is required");
  });
});
