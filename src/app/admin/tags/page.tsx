import { AdminCard, CardHeader, PageHeader } from "@/components/admin/ui";

export default function AdminTagsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        description="Taxonomy management is being prepared."
        eyebrow="Admin console"
        title="Tags & Categories"
      />
      <AdminCard>
        <CardHeader
          subtitle="This placeholder keeps the admin navigation resolvable until taxonomy tools land."
          title="Management coming soon"
        />
        <div className="px-5 py-4 text-sm text-[var(--pvm-muted)]">
          Taxonomy management is being prepared.
        </div>
      </AdminCard>
    </div>
  );
}
