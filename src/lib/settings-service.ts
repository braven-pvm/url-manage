import type { PrismaClient } from "@prisma/client";
import { env } from "./env";
import { parseDestinationUrl } from "./url-validation";

export const GLOBAL_FALLBACK_KEY = "global_fallback_url";

export async function getGlobalFallbackUrl(db: PrismaClient): Promise<string> {
  const setting = await db.setting.findUnique({
    where: { key: GLOBAL_FALLBACK_KEY },
  });

  return setting?.value ?? env.DEFAULT_FALLBACK_URL;
}

export async function updateGlobalFallbackUrl(
  db: PrismaClient,
  value: string,
  updatedBy: string,
): Promise<{ ok: true; value: string } | { ok: false; message: string }> {
  const parsed = parseDestinationUrl(value);

  if (!parsed.ok) {
    return parsed;
  }

  await db.setting.upsert({
    where: { key: GLOBAL_FALLBACK_KEY },
    create: {
      key: GLOBAL_FALLBACK_KEY,
      value: parsed.url,
      updatedBy,
    },
    update: {
      value: parsed.url,
      updatedBy,
    },
  });

  return { ok: true, value: parsed.url };
}
