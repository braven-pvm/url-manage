import { generateCode, normalizeCode, validateCode } from "./codes";
import { parseDestinationUrl } from "./url-validation";

type RedirectLookupRecord = {
  id: string;
  code: string;
  destinationUrl: string;
};

type RedirectMutationRecord = {
  id: string;
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
        userAgent: string | null;
        ipHash: string | null;
      };
    }): Promise<unknown>;
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
  description?: string;
  notes?: string;
  actorEmail: string;
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
  userAgent: string | null;
  ipHash: string | null;
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
): Promise<RedirectMutationResult> {
  const code = resolveCreateCode(input.code);

  if (!code.ok) {
    return code;
  }

  const destination = parseDestinationUrl(input.destinationUrl);

  if (!destination.ok) {
    return destination;
  }

  try {
    const redirect = await db.redirect.create({
      data: {
        code: code.code,
        destinationUrl: destination.url,
        title: input.title?.trim() ?? "",
        description: emptyToNull(input.description),
        notes: emptyToNull(input.notes),
        createdBy: input.actorEmail,
        updatedBy: input.actorEmail,
      },
    });

    return { ok: true, id: redirect.id };
  } catch (error) {
    if (isDuplicateCodeError(error)) {
      return { ok: false, message: "That code already exists" };
    }

    throw error;
  }
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

  const redirect = await db.redirect.update({
    where: { id },
    data: {
      destinationUrl: destination.url,
      title: input.title?.trim() ?? "",
      description: emptyToNull(input.description),
      notes: emptyToNull(input.notes),
      updatedBy: input.actorEmail,
    },
  });

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
        userAgent: input.userAgent,
        ipHash: input.ipHash,
      },
    });
  } catch {
    // Redirect completion must not depend on analytics persistence.
  }
}

function resolveCreateCode(
  inputCode: string | undefined,
): { ok: true; code: string } | { ok: false; message: string } {
  if (!inputCode?.trim()) {
    return { ok: true, code: generateCode() };
  }

  return validateCode(inputCode);
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function isDuplicateCodeError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
