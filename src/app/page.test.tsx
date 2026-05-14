import { describe, expect, it, vi } from "vitest";
import Home from "./page";

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("Home", () => {
  it("redirects the admin host root directly to the admin dashboard", () => {
    expect(() => Home()).toThrow("NEXT_REDIRECT:/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
