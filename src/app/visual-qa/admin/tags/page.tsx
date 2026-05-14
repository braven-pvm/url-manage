import AdminTagsPage from "@/app/admin/tags/page";
import { VisualAdminFrame } from "../VisualAdminFrame";

export default async function VisualAdminTagsPage() {
  return (
    <VisualAdminFrame>
      {await AdminTagsPage()}
    </VisualAdminFrame>
  );
}
