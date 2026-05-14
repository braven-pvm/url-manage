import AdminAccessPage from "@/app/admin/access/page";
import { VisualAdminFrame } from "../VisualAdminFrame";

export default async function VisualAdminAccessPage() {
  return (
    <VisualAdminFrame>
      {await AdminAccessPage({ searchParams: Promise.resolve({}) })}
    </VisualAdminFrame>
  );
}
