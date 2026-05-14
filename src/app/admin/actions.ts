"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/admin-auth";
import { parseAdminRole } from "@/lib/admin-roles";
import { prisma } from "@/lib/prisma";
import { createRedirect, updateRedirect } from "@/lib/redirect-service";
import {
  normalizeCatalogName,
  normalizeTag,
} from "@/lib/redirect-taxonomy";
import { updateGlobalFallbackUrl } from "@/lib/settings-service";

export async function createRedirectAction(formData: FormData) {
  const { email: actorEmail } = await requireAdminRole("EDITOR");
  const result = await createRedirect(prisma, {
    code: fieldValue(formData, "code"),
    destinationUrl: fieldValue(formData, "destinationUrl"),
    title: fieldValue(formData, "title"),
    category: fieldValue(formData, "category"),
    purpose: fieldValue(formData, "purpose"),
    tags: fieldValue(formData, "tags"),
    description: fieldValue(formData, "description"),
    notes: fieldValue(formData, "notes"),
    actorEmail,
  });

  if (!result.ok) {
    redirect(`/redirects/new?error=${encodeURIComponent(result.message)}`);
  }

  revalidatePath("/redirects");
  redirect(`/redirects/${result.id}`);
}

export async function updateRedirectAction(id: string, formData: FormData) {
  const { email: actorEmail } = await requireAdminRole("EDITOR");
  const result = await updateRedirect(prisma, id, {
    destinationUrl: fieldValue(formData, "destinationUrl"),
    title: fieldValue(formData, "title"),
    category: fieldValue(formData, "category"),
    purpose: fieldValue(formData, "purpose"),
    tags: fieldValue(formData, "tags"),
    description: fieldValue(formData, "description"),
    notes: fieldValue(formData, "notes"),
    actorEmail,
  });

  if (!result.ok) {
    redirect(`/redirects/${id}?error=${encodeURIComponent(result.message)}`);
  }

  revalidatePath("/redirects");
  revalidatePath(`/redirects/${id}`);
  redirect(`/redirects/${id}?saved=1`);
}

export async function deleteRedirectAction(id: string) {
  await requireAdminRole("EDITOR");

  await prisma.redirect.delete({
    where: { id },
  });

  revalidatePath("/redirects");
  redirect("/redirects?deleted=1");
}

export async function updateFallbackAction(formData: FormData) {
  const { email: actorEmail } = await requireAdminRole("ADMINISTRATOR");
  const result = await updateGlobalFallbackUrl(
    prisma,
    fieldValue(formData, "fallbackUrl"),
    actorEmail,
  );

  if (!result.ok) {
    redirect(`/settings?error=${encodeURIComponent(result.message)}`);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function createCategoryAction(formData: FormData) {
  const { email: actorEmail } = await requireAdminRole("EDITOR");
  const nameSource = fieldValue(formData, "name");
  const name = nameSource.trim() ? normalizeCatalogName(nameSource) : "";

  if (!name) {
    redirect("/tags?error=Enter%20a%20category%20name");
  }

  await prisma.redirectCategory.upsert({
    where: { name },
    create: {
      name,
      createdBy: actorEmail,
      updatedBy: actorEmail,
    },
    update: {
      updatedBy: actorEmail,
    },
  });

  revalidatePath("/tags");
  redirect("/tags?categorySaved=1");
}

export async function createTagAction(formData: FormData) {
  const { email: actorEmail } = await requireAdminRole("EDITOR");
  const slug = normalizeTag(fieldValue(formData, "name"));

  if (!slug) {
    redirect("/tags?error=Enter%20a%20tag%20name");
  }

  await prisma.redirectTag.upsert({
    where: { slug },
    create: {
      slug,
      label: slug,
      createdBy: actorEmail,
      updatedBy: actorEmail,
    },
    update: {
      label: slug,
      updatedBy: actorEmail,
    },
  });

  revalidatePath("/tags");
  redirect("/tags?tagSaved=1");
}

export async function renameCategoryAction(
  currentNameSource: string,
  formData: FormData,
) {
  const { email: actorEmail } = await requireAdminRole("EDITOR");
  const currentName = normalizeCatalogName(currentNameSource);
  const nextName = normalizeCatalogName(fieldValue(formData, "name"));

  if (!nextName) {
    redirect("/tags?error=Enter%20a%20category%20name");
  }

  if (nextName === currentName) {
    redirect("/tags");
  }

  await prisma.$transaction([
    prisma.redirectCategory.upsert({
      where: { name: nextName },
      create: {
        name: nextName,
        createdBy: actorEmail,
        updatedBy: actorEmail,
      },
      update: {
        updatedBy: actorEmail,
      },
    }),
    prisma.redirect.updateMany({
      where: { category: currentName },
      data: { category: nextName },
    }),
    prisma.redirectCategory.deleteMany({
      where: { name: currentName },
    }),
  ]);

  revalidatePath("/redirects");
  revalidatePath("/tags");
  redirect("/tags?categoryRenamed=1");
}

export async function deleteCategoryAction(nameSource: string) {
  await requireAdminRole("EDITOR");
  const name = normalizeCatalogName(nameSource);
  const count = await prisma.redirect.count({
    where: { category: name },
  });

  if (count > 0) {
    redirect(
      `/tags?error=${encodeURIComponent(
        `Cannot delete category while ${count} redirects still use it`,
      )}`,
    );
  }

  await prisma.redirectCategory.deleteMany({
    where: { name },
  });

  revalidatePath("/redirects");
  revalidatePath("/tags");
  redirect("/tags?categoryDeleted=1");
}

export async function renameTagAction(
  currentSlugSource: string,
  formData: FormData,
) {
  const { email: actorEmail } = await requireAdminRole("EDITOR");
  const currentSlug = normalizeTag(currentSlugSource);
  const nextSlug = normalizeTag(fieldValue(formData, "name"));

  if (!nextSlug) {
    redirect("/tags?error=Enter%20a%20tag%20name");
  }

  if (nextSlug === currentSlug) {
    redirect("/tags");
  }

  const redirects = await prisma.redirect.findMany({
    where: { tags: { has: currentSlug } },
    select: {
      id: true,
      tags: true,
    },
  });
  const redirectUpdates = redirects.map((redirectRow) =>
    prisma.redirect.update({
      where: { id: redirectRow.id },
      data: {
        tags: {
          set: [
            ...new Set(
              redirectRow.tags.map((tag) =>
                normalizeTag(tag) === currentSlug ? nextSlug : tag,
              ),
            ),
          ],
        },
      },
    }),
  );

  await prisma.$transaction([
    prisma.redirectTag.upsert({
      where: { slug: nextSlug },
      create: {
        slug: nextSlug,
        label: nextSlug,
        createdBy: actorEmail,
        updatedBy: actorEmail,
      },
      update: {
        label: nextSlug,
        updatedBy: actorEmail,
      },
    }),
    ...redirectUpdates,
    prisma.redirectTag.deleteMany({
      where: { slug: currentSlug },
    }),
  ]);

  revalidatePath("/redirects");
  revalidatePath("/tags");
  redirect("/tags?tagRenamed=1");
}

export async function deleteTagAction(slugSource: string) {
  await requireAdminRole("EDITOR");
  const slug = normalizeTag(slugSource);
  const count = await prisma.redirect.count({
    where: { tags: { has: slug } },
  });

  if (count > 0) {
    redirect(
      `/tags?error=${encodeURIComponent(
        `Cannot delete tag while ${count} redirects still use it`,
      )}`,
    );
  }

  await prisma.redirectTag.deleteMany({
    where: { slug },
  });

  revalidatePath("/redirects");
  revalidatePath("/tags");
  redirect("/tags?tagDeleted=1");
}

export async function saveAdminUserAction(formData: FormData) {
  const { email: actorEmail } = await requireAdminRole("ADMINISTRATOR");
  const email = fieldValue(formData, "email").trim().toLowerCase();
  const role = parseAdminRole(fieldValue(formData, "role"));

  if (!email || !email.includes("@")) {
    redirect("/access?error=Enter%20a%20valid%20email%20address");
  }

  if (!role) {
    redirect("/access?error=Choose%20a%20valid%20role");
  }

  if (email === actorEmail && role !== "ADMINISTRATOR") {
    redirect("/access?error=You%20cannot%20change%20your%20own%20Administrator%20role");
  }

  await prisma.adminUser.upsert({
    where: { email },
    create: {
      email,
      role,
      createdBy: actorEmail,
      updatedBy: actorEmail,
    },
    update: {
      role,
      updatedBy: actorEmail,
    },
  });

  revalidatePath("/access");
  redirect("/access?accessSaved=1");
}

export async function sendAdminInvitationAction(formData: FormData) {
  const { email: actorEmail } = await requireAdminRole("ADMINISTRATOR");
  const email = fieldValue(formData, "email").trim().toLowerCase();
  const firstName = normalizeInviteName(fieldValue(formData, "firstName"));
  const lastName = normalizeInviteName(fieldValue(formData, "lastName"));
  const role = parseAdminRole(fieldValue(formData, "role"));

  if (!firstName) {
    redirect("/access?error=Enter%20a%20first%20name");
  }

  if (!lastName) {
    redirect("/access?error=Enter%20a%20surname");
  }

  if (!email || !email.includes("@")) {
    redirect("/access?error=Enter%20a%20valid%20email%20address");
  }

  if (!role) {
    redirect("/access?error=Choose%20a%20valid%20role");
  }

  const [existingUser, existingPendingInvite] = await Promise.all([
    prisma.adminUser.findUnique({
      where: { email },
      select: { email: true },
    }),
    prisma.adminInvitation.findFirst({
      where: { email, status: "PENDING" },
      select: { id: true },
    }),
  ]);

  if (existingUser) {
    redirect("/access?error=This%20email%20already%20has%20active%20access");
  }

  if (existingPendingInvite) {
    redirect("/access?error=This%20email%20already%20has%20a%20pending%20invite");
  }

  const client = await clerkClient();
  let invitation: Awaited<
    ReturnType<typeof client.invitations.createInvitation>
  >;

  try {
    invitation = await client.invitations.createInvitation({
      emailAddress: email,
      expiresInDays: 7,
      notify: true,
      publicMetadata: {
        pvmAdminFirstName: firstName,
        pvmAdminLastName: lastName,
        pvmAdminRole: role,
      },
    });
  } catch (error) {
    const message = clerkInvitationErrorMessage(error);
    console.error("Failed to send Clerk admin invitation", {
      email,
      error: clerkInvitationErrorDetails(error),
    });

    redirect(`/access?error=${encodeURIComponent(message)}`);
  }
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.adminInvitation.create({
    data: {
      clerkInvitationId: invitation.id,
      createdBy: actorEmail,
      email,
      expiresAt,
      firstName,
      invitationUrl: invitation.url ?? null,
      lastName,
      role,
      updatedBy: actorEmail,
    },
  });

  revalidatePath("/access");
  redirect("/access?inviteSent=1");
}

export async function cancelAdminInvitationAction(invitationId: string) {
  const { email: actorEmail } = await requireAdminRole("ADMINISTRATOR");
  const invitation = await prisma.adminInvitation.findUnique({
    where: { id: invitationId },
    select: { clerkInvitationId: true, status: true },
  });

  if (!invitation || invitation.status !== "PENDING") {
    revalidatePath("/access");
    redirect("/access");
  }

  const client = await clerkClient();
  await client.invitations.revokeInvitation(invitation.clerkInvitationId);

  await prisma.adminInvitation.update({
    where: { id: invitationId },
    data: {
      status: "REVOKED",
      updatedBy: actorEmail,
    },
  });

  revalidatePath("/access");
  redirect("/access?inviteCanceled=1");
}

export async function deleteAdminUserAction(email: string) {
  const { email: actorEmail } = await requireAdminRole("ADMINISTRATOR");
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === actorEmail) {
    redirect("/access?error=You%20cannot%20remove%20your%20own%20access");
  }

  const target = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
    select: { role: true },
  });

  if (!target) {
    revalidatePath("/access");
    redirect("/access");
  }

  if (target.role === "ADMINISTRATOR") {
    const adminCount = await prisma.adminUser.count({
      where: { role: "ADMINISTRATOR" },
    });

    if (adminCount <= 1) {
      redirect(
        "/access?error=At%20least%20one%20Administrator%20is%20required",
      );
    }
  }

  await prisma.adminUser.delete({
    where: { email: normalizedEmail },
  });

  revalidatePath("/access");
  redirect("/access?accessDeleted=1");
}

function fieldValue(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

function normalizeInviteName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

type ClerkApiErrorDetail = {
  code?: string;
  longMessage?: string;
  long_message?: string;
  message?: string;
};

type ClerkApiErrorLike = {
  clerkTraceId?: string;
  errors?: ClerkApiErrorDetail[];
  message?: string;
  status?: number;
};

function clerkInvitationErrorMessage(error: unknown) {
  const clerkError = error as ClerkApiErrorLike;
  const firstError = Array.isArray(clerkError.errors)
    ? clerkError.errors[0]
    : null;
  const message =
    firstError?.longMessage ??
    firstError?.long_message ??
    firstError?.message ??
    (error instanceof Error ? error.message : null);

  return message || "Clerk could not send the invitation";
}

function clerkInvitationErrorDetails(error: unknown) {
  const clerkError = error as ClerkApiErrorLike;

  if (!clerkError || typeof clerkError !== "object") {
    return { message: String(error) };
  }

  return {
    clerkTraceId: clerkError.clerkTraceId,
    errors: clerkError.errors?.map((detail) => ({
      code: detail.code,
      message: detail.longMessage ?? detail.long_message ?? detail.message,
    })),
    message: clerkError.message,
    status: clerkError.status,
  };
}
