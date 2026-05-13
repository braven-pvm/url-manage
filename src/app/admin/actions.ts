"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminEmail } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createRedirect, updateRedirect } from "@/lib/redirect-service";
import {
  normalizeCatalogName,
  normalizeTag,
} from "@/lib/redirect-taxonomy";
import { updateGlobalFallbackUrl } from "@/lib/settings-service";

export async function createRedirectAction(formData: FormData) {
  const actorEmail = await requireAdminEmail();
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
    redirect(`/admin/redirects/new?error=${encodeURIComponent(result.message)}`);
  }

  revalidatePath("/admin");
  redirect(`/admin/redirects/${result.id}`);
}

export async function updateRedirectAction(id: string, formData: FormData) {
  const actorEmail = await requireAdminEmail();
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
    redirect(`/admin/redirects/${id}?error=${encodeURIComponent(result.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/redirects/${id}`);
}

export async function updateFallbackAction(formData: FormData) {
  const actorEmail = await requireAdminEmail();
  const result = await updateGlobalFallbackUrl(
    prisma,
    fieldValue(formData, "fallbackUrl"),
    actorEmail,
  );

  if (!result.ok) {
    redirect(`/admin/settings?error=${encodeURIComponent(result.message)}`);
  }

  revalidatePath("/admin/settings");
}

export async function createCategoryAction(formData: FormData) {
  const actorEmail = await requireAdminEmail();
  const nameSource = fieldValue(formData, "name");
  const name = nameSource.trim() ? normalizeCatalogName(nameSource) : "";

  if (!name) {
    redirect("/admin/tags?error=Enter%20a%20category%20name");
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

  revalidatePath("/admin/tags");
}

export async function createTagAction(formData: FormData) {
  const actorEmail = await requireAdminEmail();
  const slug = normalizeTag(fieldValue(formData, "name"));

  if (!slug) {
    redirect("/admin/tags?error=Enter%20a%20tag%20name");
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

  revalidatePath("/admin/tags");
}

function fieldValue(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}
