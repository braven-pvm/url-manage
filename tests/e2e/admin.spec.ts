import { expect, test } from "@playwright/test";

test("unauthenticated admin visitors reach the Clerk sign-in flow", async ({
  page,
}) => {
  const response = await page.goto("/admin", { waitUntil: "domcontentloaded" });

  test.skip(
    (response?.status() ?? 0) >= 500,
    "Clerk could not initialize with local test placeholders.",
  );

  await expect(page).toHaveURL(/sign-in|accounts|clerk/);
});
