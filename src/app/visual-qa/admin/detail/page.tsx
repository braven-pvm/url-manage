import RedirectDetailPage from "@/app/admin/redirects/[id]/page";
import { prisma } from "@/lib/prisma";
import { VisualAdminFrame } from "../VisualAdminFrame";

export default async function VisualAdminDetailPage() {
  const redirect = await prisma.redirect.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (!redirect) {
    return <VisualAdminFrame>No redirects available for visual QA.</VisualAdminFrame>;
  }

  return (
    <VisualAdminFrame>
      {await RedirectDetailPage({
        params: Promise.resolve({ id: redirect.id }),
        searchParams: Promise.resolve({}),
      })}
    </VisualAdminFrame>
  );
}
