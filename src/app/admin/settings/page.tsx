import { updateFallbackAction } from "@/app/admin/actions";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { AdminCard, CardHeader, PageHeader } from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getGlobalFallbackUrl } from "@/lib/settings-service";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requireAdminRole("ADMINISTRATOR");
  const [params, fallbackUrl] = await Promise.all([
    searchParams,
    getGlobalFallbackUrl(prisma),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        description="System-wide configuration for redirect behaviour."
        eyebrow="System"
        title="Settings"
      />
      {params.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {params.error}
        </p>
      ) : null}
      {params.saved ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Settings saved.
        </p>
      ) : null}
      <AdminCard>
        <CardHeader
          title="Redirect behaviour"
        />
        <SettingsForm
          action={updateFallbackAction}
          fallbackUrl={fallbackUrl}
          shortLinkHost={env.PUBLIC_REDIRECT_HOST}
        />
      </AdminCard>
    </div>
  );
}
