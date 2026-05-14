import SettingsPage from "@/app/admin/settings/page";
import { VisualAdminFrame } from "../VisualAdminFrame";

export default async function VisualAdminSettingsPage() {
  return (
    <VisualAdminFrame>
      {await SettingsPage({ searchParams: Promise.resolve({}) })}
    </VisualAdminFrame>
  );
}
