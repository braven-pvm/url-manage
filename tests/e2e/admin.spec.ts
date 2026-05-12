import { expect, test } from "@playwright/test";

test("unauthenticated admin visitors reach the Clerk sign-in flow", async ({
  page,
}) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/sign-in|accounts|clerk/);
});
