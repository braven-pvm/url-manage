import { generateCode, normalizeCode, validateCode } from "./codes";
import {
  normalizePurpose,
  normalizeTags,
} from "./redirect-metadata";
import {
  catalogLabelFromTag,
  normalizeCatalogName,
} from "./redirect-taxonomy";
import { parseDestinationUrl } from "./url-validation";

const GENERATED_CODE_MAX_ATTEMPTS = 5;
const GENERATED_CODE_RETRY_EXHAUSTED_MESSAGE =
  "Could not generate a unique code. Try again.";

type RedirectLookupRecord = {
  id: string;
  code: string;
  destinationUrl: string;
};

type RedirectMutationRecord = {
  id: string;
};

type RedirectCategoryUpsertArgs = {
  where: { name: string };
  create: {
    name: string;
    createdBy: string;
    updatedBy: string;
  };
  update: {
    updatedBy: string;
  };
};

type RedirectTagUpsertArgs = {
  where: { slug: string };
  create: {
    slug: string;
    label: string;
    createdBy: string;
    updatedBy: string;
  };
  update: {
    label: string;
    updatedBy: string;
  };
};

export type RedirectDb = {
  redirect: {
    findUnique(args: {
      where: { code: string };
      select: { id: true; code: true; destinationUrl: true };
    }): Promise<RedirectLookupRecord | null>;
    create(args: {
      data: {
        code: string;
        destinationUrl: string;
        title: string;
        category: string;
        purpose: string;
        tags: string[];
        description: string | null;
        notes: string | null;
        createdBy: string;
        updatedBy: string;
      };
    }): Promise<RedirectMutationRecord>;
    update(args: {
      where: { id: string };
      data: {
        destinationUrl: string;
        title: string;
        category: string;
        purpose: string;
        tags: string[];
        description: string | null;
        notes: string | null;
        updatedBy: string;
      };
    }): Promise<RedirectMutationRecord>;
  };
  clickEvent: {
    create(args: {
      data: {
        redirectId: string | null;
        requestedCode: string;
        outcome: "matched" | "fallback";
        referrer: string | null;
        referrerHost: string | null;
        userAgent: string | null;
        ipHash: string | null;
        country: string | null;
        region: string | null;
        city: string | null;
        timezone: string | null;
        latitude: string | null;
        longitude: string | null;
        utmSource: string | null;
        utmMedium: string | null;
        utmCampaign: string | null;
        utmContent: string | null;
        utmTerm: string | null;
      };
    }): Promise<unknown>;
  };
  redirectCategory?: {
    upsert(args: RedirectCategoryUpsertArgs): Promise<unknown>;
  };
  redirectTag?: {
    upsert(args: RedirectTagUpsertArgs): Promise<unknown>;
  };
};

export type RedirectDestinationResult =
  | {
      found: true;
      redirectId: string;
      code: string;
      destinationUrl: string;
    }
  | { found: false; code: string };

export type CreateRedirectInput = {
  code?: string;
  destinationUrl: string;
  title?: string;
  category?: string;
  purpose?: string;
  tags?: string | string[];
  description?: string;
  notes?: string;
  actorEmail: string;
};

type CreateRedirectOptions = {
  generateCode?: () => string;
};

export type UpdateRedirectInput = Omit<CreateRedirectInput, "code">;

export type RedirectMutationResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export type LogClickInput = {
  redirectId: string | null;
  requestedCode: string;
  outcome: "matched" | "fallback";
  referrer: string | null;
  referrerHost: string | null;
  userAgent: string | null;
  ipHash: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  latitude: string | null;
  longitude: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

export async function getRedirectDestination(
  db: RedirectDb,
  inputCode: string,
): Promise<RedirectDestinationResult> {
  const validation = validateCode(inputCode);

  if (!validation.ok) {
    return { found: false, code: normalizeCode(inputCode) || inputCode };
  }

  const redirect = await db.redirect.findUnique({
    where: { code: validation.code },
    select: { id: true, code: true, destinationUrl: true },
  });

  if (!redirect) {
    return { found: false, code: validation.code };
  }

  return {
    found: true,
    redirectId: redirect.id,
    code: redirect.code,
    destinationUrl: redirect.destinationUrl,
  };
}

export async function createRedirect(
  db: RedirectDb,
  input: CreateRedirectInput,
  options: CreateRedirectOptions = {},
): Promise<RedirectMutationResult> {
  const codeSource = resolveCreateCode(input.code, options.generateCode);

  if (!codeSource.ok) {
    return codeSource;
  }

  const destination = parseDestinationUrl(input.destinationUrl);

  if (!destination.ok) {
    return destination;
  }

  const attempts = codeSource.generated ? GENERATED_CODE_MAX_ATTEMPTS : 1;
  const category = normalizeCatalogName(input.category ?? "");
  const tags = normalizeTags(input.tags);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const code =
      codeSource.generated && attempt > 1
        ? options.generateCode?.() ?? generateCode()
        : codeSource.code;

    try {
      const redirect = await db.redirect.create({
        data: {
          code,
          destinationUrl: destination.url,
          title: input.title?.trim() ?? "",
          category,
          purpose: normalizePurpose(input.purpose),
          tags,
          description: emptyToNull(input.description),
          notes: emptyToNull(input.notes),
          createdBy: input.actorEmail,
          updatedBy: input.actorEmail,
        },
      });

      await upsertRedirectTaxonomy(db, category, tags, input.actorEmail);

      return { ok: true, id: redirect.id };
    } catch (error) {
      if (!isDuplicateCodeError(error)) {
        throw error;
      }

      if (!codeSource.generated) {
        return { ok: false, message: "That code already exists" };
      }
    }
  }

  return { ok: false, message: GENERATED_CODE_RETRY_EXHAUSTED_MESSAGE };
}

export async function updateRedirect(
  db: RedirectDb,
  id: string,
  input: UpdateRedirectInput,
): Promise<RedirectMutationResult> {
  const destination = parseDestinationUrl(input.destinationUrl);

  if (!destination.ok) {
    return destination;
  }

  const category = normalizeCatalogName(input.category ?? "");
  const tags = normalizeTags(input.tags);

  const redirect = await db.redirect.update({
    where: { id },
    data: {
      destinationUrl: destination.url,
      title: input.title?.trim() ?? "",
      category,
      purpose: normalizePurpose(input.purpose),
      tags,
      description: emptyToNull(input.description),
      notes: emptyToNull(input.notes),
      updatedBy: input.actorEmail,
    },
  });

  await upsertRedirectTaxonomy(db, category, tags, input.actorEmail);

  return { ok: true, id: redirect.id };
}

export async function logClickBestEffort(
  db: RedirectDb,
  input: LogClickInput,
): Promise<void> {
  try {
    await db.clickEvent.create({
      data: {
        redirectId: input.redirectId,
        requestedCode: input.requestedCode,
        outcome: input.outcome,
        referrer: input.referrer,
        referrerHost: input.referrerHost,
        userAgent: input.userAgent,
        ipHash: input.ipHash,
        country: input.country,
        region: input.region,
        city: input.city,
        timezone: input.timezone,
        latitude: input.latitude,
        longitude: input.longitude,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
      },
    });
  } catch {
    // Redirect completion must not depend on analytics persistence.
  }
}

function resolveCreateCode(
  inputCode: string | undefined,
  codeGenerator: (() => string) | undefined,
):
  | { ok: true; code: string; generated: boolean }
  | { ok: false; message: string } {
  if (!inputCode?.trim()) {
    return {
      ok: true,
      code: codeGenerator?.() ?? generateCode(),
      generated: true,
    };
  }

  const validation = validateCode(inputCode);

  if (!validation.ok) {
    return validation;
  }

  return { ok: true, code: validation.code, generated: false };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function isDuplicateCodeError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (!("code" in error) || error.code !== "P2002") {
    return false;
  }

  if (!("meta" in error)) {
    return true;
  }

  const target =
    error.meta && typeof error.meta === "object" && "target" in error.meta
      ? error.meta.target
      : undefined;

  return (
    target === "code" ||
    (Array.isArray(target) && target.includes("code")) ||
    target === undefined
  );
}

async function upsertRedirectTaxonomy(
  db: RedirectDb,
  category: string,
  tags: string[],
  actorEmail: string,
): Promise<void> {
  await db.redirectCategory?.upsert({
    where: { name: category },
    create: {
      name: category,
      createdBy: actorEmail,
      updatedBy: actorEmail,
    },
    update: { updatedBy: actorEmail },
  });

  for (const slug of tags) {
    const label = catalogLabelFromTag(slug);

    await db.redirectTag?.upsert({
      where: { slug },
      create: {
        slug,
        label,
        createdBy: actorEmail,
        updatedBy: actorEmail,
      },
      update: {
        label,
        updatedBy: actorEmail,
      },
    });
  }
}
