import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { adminEmailSet } from "./env";

export async function requireAdminEmail(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/not-authorized");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

  if (!email || !adminEmailSet().has(email)) {
    redirect("/not-authorized");
  }

  return email;
}
