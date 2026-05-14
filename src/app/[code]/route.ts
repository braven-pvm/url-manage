import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getRedirectDestination,
  logClickBestEffort,
} from "@/lib/redirect-service";
import { getGlobalFallbackUrl } from "@/lib/settings-service";

const LOCAL_IP_HASH_SALT = "pvm-url-local";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const result = await getRedirectDestination(prisma, code);

  if (!result.found && isAssetLikeRequest(result.code)) {
    return new NextResponse(null, { status: 404 });
  }

  const destinationUrl = result.found
    ? result.destinationUrl
    : await getGlobalFallbackUrl(prisma);

  await logClickBestEffort(prisma, {
    redirectId: result.found ? result.redirectId : null,
    requestedCode: result.code,
    redirectUrl: buildRedirectUrl(request, result.code),
    outcome: result.found ? "matched" : "fallback",
    referrer: request.headers.get("referer"),
    referrerHost: getReferrerHost(request.headers.get("referer")),
    userAgent: request.headers.get("user-agent"),
    ipHash: hashIp(getRequestIp(request)),
    country: headerValue(request, "x-vercel-ip-country"),
    region: headerValue(request, "x-vercel-ip-country-region"),
    city: headerValue(request, "x-vercel-ip-city"),
    timezone: headerValue(request, "x-vercel-ip-timezone"),
    latitude: headerValue(request, "x-vercel-ip-latitude"),
    longitude: headerValue(request, "x-vercel-ip-longitude"),
    utmSource: searchValue(request, "utm_source"),
    utmMedium: searchValue(request, "utm_medium"),
    utmCampaign: searchValue(request, "utm_campaign"),
    utmContent: searchValue(request, "utm_content"),
    utmTerm: searchValue(request, "utm_term"),
  });

  return NextResponse.redirect(destinationUrl, 302);
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) {
    return null;
  }

  const salt = getIpHashSalt();
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function getIpHashSalt(): string {
  if (process.env.IP_HASH_SALT) {
    return process.env.IP_HASH_SALT;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("IP_HASH_SALT is required in production");
  }

  return LOCAL_IP_HASH_SALT;
}

function getRequestIp(request: NextRequest): string | null {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  return forwardedFor || request.headers.get("x-real-ip");
}

function headerValue(request: NextRequest, name: string): string | null {
  return emptyToNull(request.headers.get(name));
}

function searchValue(request: NextRequest, name: string): string | null {
  return emptyToNull(request.nextUrl.searchParams.get(name));
}

function buildRedirectUrl(request: NextRequest, code: string): string {
  return new URL(`/${encodeURIComponent(code)}`, request.nextUrl.origin).toString();
}

function isAssetLikeRequest(code: string): boolean {
  return /\.[a-z0-9]{2,8}$/i.test(code.trim());
}

function emptyToNull(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function getReferrerHost(referrer: string | null): string | null {
  if (!referrer) {
    return null;
  }

  try {
    return new URL(referrer).hostname;
  } catch {
    return null;
  }
}
