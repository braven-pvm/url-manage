import AdminDashboardPage from "@/app/admin/dashboard/page";
import { VisualAdminFrame } from "../VisualAdminFrame";

export default async function VisualAdminDashboardPage() {
  return (
    <VisualAdminFrame>
      {await AdminDashboardPage()}
    </VisualAdminFrame>
  );
}
