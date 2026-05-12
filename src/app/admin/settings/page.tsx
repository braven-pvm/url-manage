import { updateFallbackAction } from "@/app/admin/actions";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { prisma } from "@/lib/prisma";
import { getGlobalFallbackUrl } from "@/lib/settings-service";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, fallbackUrl] = await Promise.all([
    searchParams,
    getGlobalFallbackUrl(prisma),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configure public redirect behavior.
        </p>
      </div>
      <SettingsForm
        action={updateFallbackAction}
        error={params.error}
        fallbackUrl={fallbackUrl}
      />
    </div>
  );
}
