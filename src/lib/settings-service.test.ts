import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GLOBAL_FALLBACK_KEY,
  getGlobalFallbackUrl,
  type SettingsDb,
  updateGlobalFallbackUrl,
} from "./settings-service";

const fallbackUrl = "https://www.pvm.co.za/";

type FakeDb = SettingsDb & {
  setting: {
    findUnique: ReturnType<typeof vi.fn<SettingsDb["setting"]["findUnique"]>>;
    upsert: ReturnType<typeof vi.fn<SettingsDb["setting"]["upsert"]>>;
  };
};

function fakeDb(): FakeDb {
  return {
    setting: {
      findUnique: vi.fn<SettingsDb["setting"]["findUnique"]>(),
      upsert: vi.fn<SettingsDb["setting"]["upsert"]>(),
    },
  };
}

describe("settings-service", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    process.env.DEFAULT_FALLBACK_URL = fallbackUrl;
  });

  it("returns stored setting value when present", async () => {
    const db = fakeDb();
    db.setting.findUnique.mockResolvedValue({
      value: "https://shop.pvm.co.za/",
    });

    await expect(getGlobalFallbackUrl(db)).resolves.toBe(
      "https://shop.pvm.co.za/",
    );
  });

  it("falls back to DEFAULT_FALLBACK_URL when setting missing", async () => {
    const db = fakeDb();
    db.setting.findUnique.mockResolvedValue(null);

    await expect(getGlobalFallbackUrl(db)).resolves.toBe(fallbackUrl);
  });

  it("rejects invalid fallback URL without upsert", async () => {
    const db = fakeDb();

    const result = await updateGlobalFallbackUrl(
      db,
      "/internal",
      "admin@pvm.co.za",
    );

    expect(result.ok).toBe(false);
    expect(db.setting.upsert).not.toHaveBeenCalled();
  });

  it("upserts normalized valid URL with updatedBy", async () => {
    const db = fakeDb();
    db.setting.upsert.mockResolvedValue({
      key: GLOBAL_FALLBACK_KEY,
      value: "https://shop.pvm.co.za/",
      updatedBy: "admin@pvm.co.za",
    });

    await expect(
      updateGlobalFallbackUrl(
        db,
        " https://shop.pvm.co.za ",
        "admin@pvm.co.za",
      ),
    ).resolves.toEqual({ ok: true, value: "https://shop.pvm.co.za/" });

    expect(db.setting.upsert).toHaveBeenCalledWith({
      where: { key: GLOBAL_FALLBACK_KEY },
      create: {
        key: GLOBAL_FALLBACK_KEY,
        value: "https://shop.pvm.co.za/",
        updatedBy: "admin@pvm.co.za",
      },
      update: {
        value: "https://shop.pvm.co.za/",
        updatedBy: "admin@pvm.co.za",
      },
    });
  });
});
