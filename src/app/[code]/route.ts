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
  const destinationUrl = result.found
    ? result.destinationUrl
    : await getGlobalFallbackUrl(prisma);

  await logClickBestEffort(prisma, {
    redirectId: result.found ? result.redirectId : null,
    requestedCode: result.code,
    outcome: result.found ? "matched" : "fallback",
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
    ipHash: hashIp(getRequestIp(request)),
  });

  return NextResponse.redirect(destinationUrl, 302);
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) {
    return null;
  }

  const salt = process.env.IP_HASH_SALT ?? LOCAL_IP_HASH_SALT;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function getRequestIp(request: NextRequest): string | null {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  return forwardedFor || request.headers.get("x-real-ip");
}
