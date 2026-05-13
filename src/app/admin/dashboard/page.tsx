import { AdminCard, CardHeader, PageHeader } from "@/components/admin/ui";

export default function AdminDashboardPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        description="Redirect overview is being prepared."
        eyebrow="Admin console"
        title="Dashboard"
      />
      <AdminCard>
        <CardHeader
          subtitle="This placeholder keeps the admin navigation resolvable until the dashboard workflow lands."
          title="Overview coming soon"
        />
        <div className="px-5 py-4 text-sm text-[var(--pvm-muted)]">
          Redirect overview is being prepared.
        </div>
      </AdminCard>
    </div>
  );
}
