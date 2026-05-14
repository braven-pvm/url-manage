import AdminHomePage from "@/app/admin/page";
import { VisualAdminFrame } from "./VisualAdminFrame";

export default async function VisualAdminListPage() {
  return (
    <VisualAdminFrame>
      {await AdminHomePage({ searchParams: Promise.resolve({}) })}
    </VisualAdminFrame>
  );
}
