import { describe, expect, it } from "vitest";
import { adminEmailSet, parseEnv } from "./env";

const validSource = {
  DEFAULT_FALLBACK_URL: "https://www.pvm.co.za/",
};

describe("parseEnv", () => {
  it("parses admin emails with comma splitting, trim, lowercase, and empty entries", () => {
    const parsed = parseEnv({
      ...validSource,
      ADMIN_EMAILS: " Admin@PVM.co.za, ,ops@pvm.co.za ",
    });

    expect([...adminEmailSet(parsed)]).toEqual([
      "admin@pvm.co.za",
      "ops@pvm.co.za",
    ]);
  });

  it("uses default hosts", () => {
    expect(parseEnv(validSource)).toMatchObject({
      PUBLIC_REDIRECT_HOST: "go.pvm.co.za",
      ADMIN_HOST: "admin.pvm.co.za",
    });
  });

  it("rejects invalid fallback URLs", () => {
    expect(() =>
      parseEnv({
        DEFAULT_FALLBACK_URL: "not a url",
      }),
    ).toThrow();
  });

  it("rejects non-http fallback URLs", () => {
    expect(() =>
      parseEnv({
        DEFAULT_FALLBACK_URL: "ftp://www.pvm.co.za/",
      }),
    ).toThrow();
  });
});
