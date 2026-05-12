import { customAlphabet } from "nanoid";

const alphabet = "23456789abcdefghijkmnopqrstuvwxyz";
const createNanoid = customAlphabet(alphabet, 8);
const codePattern = /^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$/;
const reservedCodes = new Set(["admin", "sign-in", "sign-up"]);

export type CodeValidationResult =
  | { ok: true; code: string }
  | { ok: false; message: string };

export function normalizeCode(input: string): string {
  return input.trim().toLowerCase();
}

export function validateCode(input: string): CodeValidationResult {
  const code = normalizeCode(input);

  if (code.length < 3 || code.length > 64) {
    return { ok: false, message: "Code must be between 3 and 64 characters" };
  }

  if (!codePattern.test(code)) {
    return {
      ok: false,
      message: "Use lowercase letters, numbers, hyphens, or underscores",
    };
  }

  if (reservedCodes.has(code)) {
    return { ok: false, message: "This code is reserved" };
  }

  return { ok: true, code };
}

export function generateCode(): string {
  return createNanoid();
}
