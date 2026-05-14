import { auth, clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasAdminRole, type AdminRoleName } from "./admin-roles";
import { prisma } from "./prisma";

export {
  ADMIN_ROLE_LABELS,
  hasAdminRole,
  type AdminRoleName,
} from "./admin-roles";

export type AdminActor = {
  email: string;
  role: AdminRoleName;
};

type SignedInAdminCandidate = {
  email: string;
  publicMetadata: Record<string, unknown> | null;
  userId: string;
};

export async function requireAdminEmail(): Promise<string> {
  const actor = await requireAdminRole("VIEWER");

  return actor.email;
}

export async function requireAdminRole(
  requiredRole: AdminRoleName,
): Promise<AdminActor> {
  const visualQaActor = await getVisualQaActor();

  if (visualQaActor) {
    return visualQaActor;
  }

  const signedInUser = await getSignedInAdminCandidate();
  const email = signedInUser.email;
  const adminUser = await prisma.adminUser.findUnique({
    where: { email },
    select: { email: true, role: true },
  });

  const actor = adminUser ?? (await activateAcceptedInvitation(signedInUser));

  if (!actor || !hasAdminRole(actor.role, requiredRole)) {
    redirect("/not-authorized");
  }

  return actor;
}

async function getVisualQaActor(): Promise<AdminActor | null> {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  let requestHeaders: { get(name: string): string | null };

  try {
    requestHeaders = await headers();
  } catch {
    return null;
  }

  if (requestHeaders.get("x-pvm-visual-qa") !== "1") {
    return null;
  }

  return {
    email: "visual-qa@pvm.co.za",
    role: "ADMINISTRATOR",
  };
}

async function getSignedInAdminCandidate(): Promise<SignedInAdminCandidate> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/not-authorized");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

  if (!email) {
    redirect("/not-authorized");
  }

  return {
    email,
    publicMetadata: user.publicMetadata ?? null,
    userId,
  };
}

async function activateAcceptedInvitation({
  email,
  publicMetadata,
  userId,
}: SignedInAdminCandidate): Promise<AdminActor | null> {
  const invitation = await prisma.adminInvitation.findFirst({
    where: { email, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      firstName: true,
      id: true,
      lastName: true,
      role: true,
    },
  });

  if (!invitation) {
    return null;
  }

  const metadataRole = publicMetadata?.pvmAdminRole;
  const role =
    typeof metadataRole === "string" && hasAdminRoleValue(metadataRole)
      ? metadataRole
      : invitation.role;

  await prisma.$transaction([
    prisma.adminUser.upsert({
      where: { email },
      create: {
        clerkUserId: userId,
        createdBy: "clerk-invitation",
        email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role,
        updatedBy: "clerk-invitation",
      },
      update: {
        clerkUserId: userId,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role,
        updatedBy: "clerk-invitation",
      },
    }),
    prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: {
        acceptedAt: new Date(),
        status: "ACCEPTED",
        updatedBy: "clerk-invitation",
      },
    }),
  ]);

  return { email, role };
}

function hasAdminRoleValue(value: string): value is AdminRoleName {
  return value === "ADMINISTRATOR" || value === "EDITOR" || value === "VIEWER";
}
