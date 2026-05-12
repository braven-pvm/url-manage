import { beforeEach, describe, expect, it, vi } from "vitest";

const fallbackUrl = "https://www.pvm.co.za/";

type FakeDb = {
  setting: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

function fakeDb(): FakeDb {
  return {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  };
}

async function importService() {
  vi.resetModules();
  process.env.DEFAULT_FALLBACK_URL = fallbackUrl;
  return import("./settings-service");
}

describe("settings-service", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    process.env.DEFAULT_FALLBACK_URL = fallbackUrl;
  });

  it("returns stored setting value when present", async () => {
    const { getGlobalFallbackUrl } = await importService();
    const db = fakeDb();
    db.setting.findUnique.mockResolvedValue({
      key: "global_fallback_url",
      value: "https://shop.pvm.co.za/",
    });

    await expect(getGlobalFallbackUrl(db as never)).resolves.toBe(
      "https://shop.pvm.co.za/",
    );
  });

  it("falls back to DEFAULT_FALLBACK_URL when setting missing", async () => {
    const { getGlobalFallbackUrl } = await importService();
    const db = fakeDb();
    db.setting.findUnique.mockResolvedValue(null);

    await expect(getGlobalFallbackUrl(db as never)).resolves.toBe(fallbackUrl);
  });

  it("rejects invalid fallback URL without upsert", async () => {
    const { updateGlobalFallbackUrl } = await importService();
    const db = fakeDb();

    const result = await updateGlobalFallbackUrl(
      db as never,
      "/internal",
      "admin@pvm.co.za",
    );

    expect(result.ok).toBe(false);
    expect(db.setting.upsert).not.toHaveBeenCalled();
  });

  it("upserts normalized valid URL with updatedBy", async () => {
    const { GLOBAL_FALLBACK_KEY, updateGlobalFallbackUrl } = await importService();
    const db = fakeDb();
    db.setting.upsert.mockResolvedValue({
      key: GLOBAL_FALLBACK_KEY,
      value: "https://shop.pvm.co.za/",
      updatedBy: "admin@pvm.co.za",
    });

    await expect(
      updateGlobalFallbackUrl(
        db as never,
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
