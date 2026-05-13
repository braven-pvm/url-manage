import { describe, expect, it, vi } from "vitest";
import { validateCode } from "./codes";
import {
  createRedirect,
  getRedirectDestination,
  logClickBestEffort,
  type RedirectDb,
  updateRedirect,
} from "./redirect-service";

type FakeDb = RedirectDb & {
  redirect: {
    findUnique: ReturnType<typeof vi.fn<RedirectDb["redirect"]["findUnique"]>>;
    create: ReturnType<typeof vi.fn<RedirectDb["redirect"]["create"]>>;
    update: ReturnType<typeof vi.fn<RedirectDb["redirect"]["update"]>>;
  };
  redirectCategory: {
    upsert: ReturnType<
      typeof vi.fn<NonNullable<RedirectDb["redirectCategory"]>["upsert"]>
    >;
  };
  redirectTag: {
    upsert: ReturnType<
      typeof vi.fn<NonNullable<RedirectDb["redirectTag"]>["upsert"]>
    >;
  };
  clickEvent: {
    create: ReturnType<typeof vi.fn<RedirectDb["clickEvent"]["create"]>>;
  };
};

function fakeDb(options: { catalog?: boolean } = {}): FakeDb {
  const db: FakeDb = {
    redirect: {
      findUnique: vi.fn<RedirectDb["redirect"]["findUnique"]>(),
      create: vi.fn<RedirectDb["redirect"]["create"]>(),
      update: vi.fn<RedirectDb["redirect"]["update"]>(),
    },
    redirectCategory: undefined as unknown as FakeDb["redirectCategory"],
    redirectTag: undefined as unknown as FakeDb["redirectTag"],
    clickEvent: {
      create: vi.fn<RedirectDb["clickEvent"]["create"]>(),
    },
  };

  if (options.catalog) {
    db.redirectCategory = {
      upsert:
        vi.fn<NonNullable<RedirectDb["redirectCategory"]>["upsert"]>(),
    };
    db.redirectTag = {
      upsert: vi.fn<NonNullable<RedirectDb["redirectTag"]>["upsert"]>(),
    };
  }

  return db;
}

describe("redirect-service", () => {
  const duplicateCodeError = {
    code: "P2002",
    meta: { target: ["code"] },
  };

  it("returns destination for a known code", async () => {
    const db = fakeDb();
    db.redirect.findUnique.mockResolvedValue({
      id: "r1",
      code: "care",
      destinationUrl: "https://shop.pvm.co.za/care",
    });

    await expect(getRedirectDestination(db, "Care")).resolves.toEqual({
      found: true,
      redirectId: "r1",
      code: "care",
      destinationUrl: "https://shop.pvm.co.za/care",
    });

    expect(db.redirect.findUnique).toHaveBeenCalledWith({
      where: { code: "care" },
      select: { id: true, code: true, destinationUrl: true },
    });
  });

  it("reports malformed codes without throwing or querying", async () => {
    const db = fakeDb();

    await expect(getRedirectDestination(db, "../admin")).resolves.toEqual({
      found: false,
      code: "../admin",
    });

    expect(db.redirect.findUnique).not.toHaveBeenCalled();
  });

  it("reports a missing valid code", async () => {
    const db = fakeDb();
    db.redirect.findUnique.mockResolvedValue(null);

    await expect(getRedirectDestination(db, "Missing")).resolves.toEqual({
      found: false,
      code: "missing",
    });
  });

  it("creates a redirect with normalized code and validated URL", async () => {
    const db = fakeDb();
    db.redirect.create.mockResolvedValue({ id: "r1" });

    const result = await createRedirect(db, {
      code: " Care ",
      category: " Product ",
      purpose: " Product packaging ",
      tags: " Energy Bar, QR , energy bar ,, ",
      destinationUrl: " https://shop.pvm.co.za/care ",
      title: " Care ",
      description: "",
      notes: "  ",
      actorEmail: "admin@pvm.co.za",
    });

    expect(result).toEqual({ ok: true, id: "r1" });
    expect(db.redirect.create).toHaveBeenCalledWith({
      data: {
        code: "care",
        category: "Product",
        purpose: "Product packaging",
        tags: ["energy-bar", "qr"],
        destinationUrl: "https://shop.pvm.co.za/care",
        title: "Care",
        description: null,
        notes: null,
        createdBy: "admin@pvm.co.za",
        updatedBy: "admin@pvm.co.za",
      },
    });
  });

  it("upserts category and tags after creating a redirect", async () => {
    const db = fakeDb({ catalog: true });
    db.redirect.create.mockResolvedValue({ id: "r1" });
    db.redirectCategory.upsert.mockResolvedValue({});
    db.redirectTag.upsert.mockResolvedValue({});

    await expect(
      createRedirect(db, {
        code: "care",
        category: " referalls ",
        tags: " Energy Bar, QR, energy bar ",
        destinationUrl: "https://shop.pvm.co.za/care",
        title: "Care",
        actorEmail: "admin@pvm.co.za",
      }),
    ).resolves.toEqual({ ok: true, id: "r1" });

    expect(db.redirect.create.mock.calls[0]?.[0].data.category).toBe(
      "Referrals",
    );
    expect(db.redirect.create.mock.calls[0]?.[0].data.tags).toEqual([
      "energy-bar",
      "qr",
    ]);
    expect(db.redirectCategory.upsert).toHaveBeenCalledWith({
      where: { name: "Referrals" },
      create: {
        name: "Referrals",
        createdBy: "admin@pvm.co.za",
        updatedBy: "admin@pvm.co.za",
      },
      update: { updatedBy: "admin@pvm.co.za" },
    });
    expect(db.redirectTag.upsert).toHaveBeenCalledTimes(2);
    expect(db.redirectTag.upsert).toHaveBeenNthCalledWith(1, {
      where: { slug: "energy-bar" },
      create: {
        slug: "energy-bar",
        label: "Energy Bar",
        createdBy: "admin@pvm.co.za",
        updatedBy: "admin@pvm.co.za",
      },
      update: {
        label: "Energy Bar",
        updatedBy: "admin@pvm.co.za",
      },
    });
    expect(db.redirectTag.upsert).toHaveBeenNthCalledWith(2, {
      where: { slug: "qr" },
      create: {
        slug: "qr",
        label: "Qr",
        createdBy: "admin@pvm.co.za",
        updatedBy: "admin@pvm.co.za",
      },
      update: {
        label: "Qr",
        updatedBy: "admin@pvm.co.za",
      },
    });
  });

  it("still creates a redirect when taxonomy sync fails", async () => {
    const db = fakeDb({ catalog: true });
    db.redirect.create.mockResolvedValue({ id: "r1" });
    db.redirectCategory.upsert.mockRejectedValue(new Error("catalog down"));

    await expect(
      createRedirect(db, {
        code: "care",
        category: "Promotion",
        tags: "QR",
        destinationUrl: "https://shop.pvm.co.za/care",
        title: "Care",
        actorEmail: "admin@pvm.co.za",
      }),
    ).resolves.toEqual({ ok: true, id: "r1" });

    expect(db.redirect.create).toHaveBeenCalledTimes(1);
    expect(db.redirectCategory.upsert).toHaveBeenCalledTimes(1);
  });

  it("generates a valid code when create code is blank", async () => {
    const db = fakeDb();
    db.redirect.create.mockResolvedValue({ id: "r1" });

    const result = await createRedirect(db, {
      code: "   ",
      category: "   ",
      purpose: "   ",
      tags: "   ",
      destinationUrl: "https://shop.pvm.co.za/care",
      title: "Care",
      actorEmail: "admin@pvm.co.za",
    });

    expect(result).toEqual({ ok: true, id: "r1" });
    const call = db.redirect.create.mock.calls[0]?.[0];
    expect(call).toBeDefined();
    expect(validateCode(call?.data.code ?? "").ok).toBe(true);
    expect(call?.data.category).toBe("General");
    expect(call?.data.purpose).toBe("General");
    expect(call?.data.tags).toEqual([]);
  });

  it("maps duplicate code errors to a friendly result", async () => {
    const db = fakeDb();
    db.redirect.create.mockRejectedValue(duplicateCodeError);

    await expect(
      createRedirect(db, {
        code: "care",
        destinationUrl: "https://shop.pvm.co.za/care",
        title: "Care",
        actorEmail: "admin@pvm.co.za",
      }),
    ).resolves.toEqual({ ok: false, message: "That code already exists" });
  });

  it("retries generated code collisions and succeeds with a later code", async () => {
    const db = fakeDb();
    const generate = vi
      .fn<() => string>()
      .mockReturnValueOnce("abc12345")
      .mockReturnValueOnce("xyz98765");

    db.redirect.create
      .mockRejectedValueOnce(duplicateCodeError)
      .mockResolvedValueOnce({ id: "r1" });

    await expect(
      createRedirect(
        db,
        {
          code: "",
          destinationUrl: "https://shop.pvm.co.za/care",
          title: "Care",
          actorEmail: "admin@pvm.co.za",
        },
        { generateCode: generate },
      ),
    ).resolves.toEqual({ ok: true, id: "r1" });

    expect(generate).toHaveBeenCalledTimes(2);
    expect(db.redirect.create).toHaveBeenCalledTimes(2);
    expect(db.redirect.create.mock.calls[0]?.[0].data.code).toBe("abc12345");
    expect(db.redirect.create.mock.calls[1]?.[0].data.code).toBe("xyz98765");
  });

  it("returns a clear failure when generated code retries are exhausted", async () => {
    const db = fakeDb();
    const generate = vi.fn<() => string>().mockReturnValue("abc12345");
    db.redirect.create.mockRejectedValue(duplicateCodeError);

    await expect(
      createRedirect(
        db,
        {
          code: "   ",
          destinationUrl: "https://shop.pvm.co.za/care",
          title: "Care",
          actorEmail: "admin@pvm.co.za",
        },
        { generateCode: generate },
      ),
    ).resolves.toEqual({
      ok: false,
      message: "Could not generate a unique code. Try again.",
    });

    expect(generate).toHaveBeenCalledTimes(5);
    expect(db.redirect.create).toHaveBeenCalledTimes(5);
  });

  it("does not retry manual duplicate codes", async () => {
    const db = fakeDb();
    const generate = vi.fn<() => string>();
    db.redirect.create.mockRejectedValue(duplicateCodeError);

    await expect(
      createRedirect(
        db,
        {
          code: "care",
          destinationUrl: "https://shop.pvm.co.za/care",
          title: "Care",
          actorEmail: "admin@pvm.co.za",
        },
        { generateCode: generate },
      ),
    ).resolves.toEqual({ ok: false, message: "That code already exists" });

    expect(generate).not.toHaveBeenCalled();
    expect(db.redirect.create).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid create destinations without creating", async () => {
    const db = fakeDb();

    const result = await createRedirect(db, {
      code: "care",
      destinationUrl: "/care",
      title: "Care",
      actorEmail: "admin@pvm.co.za",
    });

    expect(result.ok).toBe(false);
    expect(db.redirect.create).not.toHaveBeenCalled();
  });

  it("updates destination without changing code", async () => {
    const db = fakeDb();
    db.redirect.update.mockResolvedValue({ id: "r1" });

    const result = await updateRedirect(db, "r1", {
      destinationUrl: " https://shop.pvm.co.za/new ",
      category: " Promo ",
      purpose: " Event ",
      tags: "Retail, In-store Demo",
      title: " New ",
      description: " Updated ",
      notes: "",
      actorEmail: "admin@pvm.co.za",
    });

    expect(result).toEqual({ ok: true, id: "r1" });
    expect(db.redirect.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: {
        destinationUrl: "https://shop.pvm.co.za/new",
        category: "Promo",
        purpose: "Event",
        tags: ["retail", "in-store-demo"],
        title: "New",
        description: "Updated",
        notes: null,
        updatedBy: "admin@pvm.co.za",
      },
    });
  });

  it("upserts category and tags after updating a redirect", async () => {
    const db = fakeDb({ catalog: true });
    db.redirect.update.mockResolvedValue({ id: "r1" });
    db.redirectCategory.upsert.mockResolvedValue({});
    db.redirectTag.upsert.mockResolvedValue({});

    await expect(
      updateRedirect(db, "r1", {
        destinationUrl: "https://shop.pvm.co.za/new",
        category: "promotions",
        tags: ["In Store Demo", "QR"],
        title: "New",
        actorEmail: "editor@pvm.co.za",
      }),
    ).resolves.toEqual({ ok: true, id: "r1" });

    expect(db.redirect.update.mock.calls[0]?.[0].data.category).toBe(
      "Promotion",
    );
    expect(db.redirect.update.mock.calls[0]?.[0].data.tags).toEqual([
      "in-store-demo",
      "qr",
    ]);
    expect(db.redirectCategory.upsert).toHaveBeenCalledWith({
      where: { name: "Promotion" },
      create: {
        name: "Promotion",
        createdBy: "editor@pvm.co.za",
        updatedBy: "editor@pvm.co.za",
      },
      update: { updatedBy: "editor@pvm.co.za" },
    });
    expect(db.redirectTag.upsert).toHaveBeenCalledTimes(2);
    expect(db.redirectTag.upsert).toHaveBeenNthCalledWith(1, {
      where: { slug: "in-store-demo" },
      create: {
        slug: "in-store-demo",
        label: "In Store Demo",
        createdBy: "editor@pvm.co.za",
        updatedBy: "editor@pvm.co.za",
      },
      update: {
        label: "In Store Demo",
        updatedBy: "editor@pvm.co.za",
      },
    });
    expect(db.redirectTag.upsert).toHaveBeenNthCalledWith(2, {
      where: { slug: "qr" },
      create: {
        slug: "qr",
        label: "Qr",
        createdBy: "editor@pvm.co.za",
        updatedBy: "editor@pvm.co.za",
      },
      update: {
        label: "Qr",
        updatedBy: "editor@pvm.co.za",
      },
    });
  });

  it("still updates a redirect when taxonomy sync fails", async () => {
    const db = fakeDb({ catalog: true });
    db.redirect.update.mockResolvedValue({ id: "r1" });
    db.redirectCategory.upsert.mockResolvedValue({});
    db.redirectTag.upsert.mockRejectedValue(new Error("catalog down"));

    await expect(
      updateRedirect(db, "r1", {
        destinationUrl: "https://shop.pvm.co.za/new",
        category: "Promotion",
        tags: "QR",
        title: "New",
        actorEmail: "editor@pvm.co.za",
      }),
    ).resolves.toEqual({ ok: true, id: "r1" });

    expect(db.redirect.update).toHaveBeenCalledTimes(1);
    expect(db.redirectTag.upsert).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid update destinations without updating", async () => {
    const db = fakeDb();

    const result = await updateRedirect(db, "r1", {
      destinationUrl: "javascript:alert(1)",
      title: "Care",
      actorEmail: "admin@pvm.co.za",
    });

    expect(result.ok).toBe(false);
    expect(db.redirect.update).not.toHaveBeenCalled();
  });

  it("swallows click logging failures", async () => {
    const db = fakeDb();
    db.clickEvent.create.mockRejectedValue(new Error("db unavailable"));

    await expect(
      logClickBestEffort(db, {
        redirectId: "r1",
        requestedCode: "care",
        outcome: "matched",
        referrer: null,
        referrerHost: null,
        userAgent: null,
        ipHash: null,
        country: null,
        region: null,
        city: null,
        timezone: null,
        latitude: null,
        longitude: null,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        utmContent: null,
        utmTerm: null,
      }),
    ).resolves.toBeUndefined();
  });

  it("logs matched click payloads", async () => {
    const db = fakeDb();
    db.clickEvent.create.mockResolvedValue({});

    await logClickBestEffort(db, {
      redirectId: "r1",
      requestedCode: "Care",
      outcome: "matched",
      referrer: "https://referrer.example/",
      referrerHost: "referrer.example",
      userAgent: "Test Browser",
      ipHash: "hash",
      country: "ZA",
      region: "Gauteng",
      city: "Johannesburg",
      timezone: "Africa/Johannesburg",
      latitude: "-26.2041",
      longitude: "28.0473",
      utmSource: "qr",
      utmMedium: "packaging",
      utmCampaign: "energy",
      utmContent: "front",
      utmTerm: "bar",
    });

    expect(db.clickEvent.create).toHaveBeenCalledWith({
      data: {
        redirectId: "r1",
        requestedCode: "Care",
        outcome: "matched",
        referrer: "https://referrer.example/",
        referrerHost: "referrer.example",
        userAgent: "Test Browser",
        ipHash: "hash",
        country: "ZA",
        region: "Gauteng",
        city: "Johannesburg",
        timezone: "Africa/Johannesburg",
        latitude: "-26.2041",
        longitude: "28.0473",
        utmSource: "qr",
        utmMedium: "packaging",
        utmCampaign: "energy",
        utmContent: "front",
        utmTerm: "bar",
      },
    });
  });

  it("logs fallback click payloads", async () => {
    const db = fakeDb();
    db.clickEvent.create.mockResolvedValue({});

    await logClickBestEffort(db, {
      redirectId: null,
      requestedCode: "../admin",
      outcome: "fallback",
      referrer: null,
      referrerHost: null,
      userAgent: null,
      ipHash: null,
      country: null,
      region: null,
      city: null,
      timezone: null,
      latitude: null,
      longitude: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
    });

    expect(db.clickEvent.create).toHaveBeenCalledWith({
      data: {
        redirectId: null,
        requestedCode: "../admin",
        outcome: "fallback",
        referrer: null,
        referrerHost: null,
        userAgent: null,
        ipHash: null,
        country: null,
        region: null,
        city: null,
        timezone: null,
        latitude: null,
        longitude: null,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        utmContent: null,
        utmTerm: null,
      },
    });
  });
});
