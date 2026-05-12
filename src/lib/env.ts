import { z } from "zod";

const envSchema = z.object({
  ADMIN_EMAILS: z.string().default(""),
  DEFAULT_FALLBACK_URL: z.string().url(),
  PUBLIC_REDIRECT_HOST: z.string().default("go.pvm.co.za"),
  ADMIN_HOST: z.string().default("admin.pvm.co.za"),
});

export const env = envSchema.parse({
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  DEFAULT_FALLBACK_URL: process.env.DEFAULT_FALLBACK_URL,
  PUBLIC_REDIRECT_HOST: process.env.PUBLIC_REDIRECT_HOST,
  ADMIN_HOST: process.env.ADMIN_HOST,
});

export function adminEmailSet(): Set<string> {
  return new Set(
    env.ADMIN_EMAILS.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}
