import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { adminEmailSet } from "./env";

export async function requireAdminEmail(): Promise<string> {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

  if (!email || !adminEmailSet().has(email)) {
    redirect("/not-authorized");
  }

  return email;
}
