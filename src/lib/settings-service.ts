import { getEnv } from "./env";
import { parseDestinationUrl } from "./url-validation";

export const GLOBAL_FALLBACK_KEY = "global_fallback_url";

export type SettingsDb = {
  setting: {
    findUnique(args: {
      where: { key: string };
    }): Promise<{ value: string } | null>;
    upsert(args: {
      where: { key: string };
      create: { key: string; value: string; updatedBy: string };
      update: { value: string; updatedBy: string };
    }): Promise<unknown>;
  };
};

export async function getGlobalFallbackUrl(db: SettingsDb): Promise<string> {
  const setting = await db.setting.findUnique({
    where: { key: GLOBAL_FALLBACK_KEY },
  });

  return setting?.value ?? getEnv().DEFAULT_FALLBACK_URL;
}

export async function updateGlobalFallbackUrl(
  db: SettingsDb,
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
