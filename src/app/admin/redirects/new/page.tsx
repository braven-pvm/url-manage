import { RedirectForm } from "@/components/admin/RedirectForm";
import { createRedirectAction } from "../../actions";

export default async function NewRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">New redirect</h1>
      <RedirectForm action={createRedirectAction} error={params.error} />
    </div>
  );
}
