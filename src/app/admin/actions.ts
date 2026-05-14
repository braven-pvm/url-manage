"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminEmail } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createRedirect, updateRedirect } from "@/lib/redirect-service";
import { updateGlobalFallbackUrl } from "@/lib/settings-service";
import {
  normalizeCatalogName,
  normalizeTag,
} from "@/lib/redirect-taxonomy";

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
    create: { name, createdBy: actorEmail, updatedBy: actorEmail },
    update: { updatedBy: actorEmail },
  });

  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function createTagAction(formData: FormData) {
  const actorEmail = await requireAdminEmail();
  const slug = normalizeTag(fieldValue(formData, "name"));

  if (!slug) {
    redirect("/admin/tags?error=Enter%20a%20tag%20name");
  }

  await prisma.redirectTag.upsert({
    where: { slug },
    create: { slug, label: slug, createdBy: actorEmail, updatedBy: actorEmail },
    update: { label: slug, updatedBy: actorEmail },
  });

  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function renameCategoryAction(
  currentNameSource: string,
  formData: FormData,
) {
  const actorEmail = await requireAdminEmail();
  const currentName = normalizeCatalogName(currentNameSource);
  const nextName = normalizeCatalogName(fieldValue(formData, "name"));

  if (!nextName) {
    redirect("/admin/tags?error=Enter%20a%20category%20name");
  }

  if (nextName === currentName) {
    redirect("/admin/tags");
  }

  await prisma.$transaction([
    prisma.redirectCategory.upsert({
      where: { name: nextName },
      create: { name: nextName, createdBy: actorEmail, updatedBy: actorEmail },
      update: { updatedBy: actorEmail },
    }),
    prisma.redirect.updateMany({
      where: { category: currentName },
      data: { category: nextName },
    }),
    prisma.redirectCategory.deleteMany({
      where: { name: currentName },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function deleteCategoryAction(nameSource: string) {
  await requireAdminEmail();
  const name = normalizeCatalogName(nameSource);
  const count = await prisma.redirect.count({ where: { category: name } });

  if (count > 0) {
    redirect(
      `/admin/tags?error=${encodeURIComponent(
        `Cannot delete category while ${count} redirects still use it`,
      )}`,
    );
  }

  await prisma.redirectCategory.deleteMany({ where: { name } });

  revalidatePath("/admin");
  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function renameTagAction(
  currentSlugSource: string,
  formData: FormData,
) {
  const actorEmail = await requireAdminEmail();
  const currentSlug = normalizeTag(currentSlugSource);
  const nextSlug = normalizeTag(fieldValue(formData, "name"));

  if (!nextSlug) {
    redirect("/admin/tags?error=Enter%20a%20tag%20name");
  }

  if (nextSlug === currentSlug) {
    redirect("/admin/tags");
  }

  const redirects = await prisma.redirect.findMany({
    where: { tags: { has: currentSlug } },
    select: { id: true, tags: true },
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
      create: { slug: nextSlug, label: nextSlug, createdBy: actorEmail, updatedBy: actorEmail },
      update: { label: nextSlug, updatedBy: actorEmail },
    }),
    ...redirectUpdates,
    prisma.redirectTag.deleteMany({ where: { slug: currentSlug } }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function deleteTagAction(slugSource: string) {
  await requireAdminEmail();
  const slug = normalizeTag(slugSource);
  const count = await prisma.redirect.count({ where: { tags: { has: slug } } });

  if (count > 0) {
    redirect(
      `/admin/tags?error=${encodeURIComponent(
        `Cannot delete tag while ${count} redirects still use it`,
      )}`,
    );
  }

  await prisma.redirectTag.deleteMany({ where: { slug } });

  revalidatePath("/admin");
  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

function fieldValue(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}
