import { z } from "zod";
import { parseDestinationUrl } from "./url-validation";

const envSchema = z.object({
  DEFAULT_FALLBACK_URL: z
    .string()
    .refine((value) => parseDestinationUrl(value).ok, {
      message: "DEFAULT_FALLBACK_URL must be an absolute http(s) URL",
    })
    .transform((value) => {
      const parsed = parseDestinationUrl(value);

      if (!parsed.ok) {
        throw new Error(parsed.message);
      }

      return parsed.url;
    }),
  PUBLIC_REDIRECT_HOST: z.string().default("go.pvm.co.za"),
  ADMIN_HOST: z.string().default("admin.pvm.co.za"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(
  source: Partial<Record<keyof AppEnv, string | undefined>>,
): AppEnv {
  return envSchema.parse(source);
}

export function getEnv(): AppEnv {
  return parseEnv({
    DEFAULT_FALLBACK_URL: process.env.DEFAULT_FALLBACK_URL,
    PUBLIC_REDIRECT_HOST: process.env.PUBLIC_REDIRECT_HOST,
    ADMIN_HOST: process.env.ADMIN_HOST,
  });
}

export const env = new Proxy({} as AppEnv, {
  get(_target, property: keyof AppEnv) {
    return getEnv()[property];
  },
});
