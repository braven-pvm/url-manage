import NewRedirectPage from "@/app/admin/redirects/new/page";
import { VisualAdminFrame } from "../VisualAdminFrame";

export default async function VisualAdminNewRedirectPage() {
  return (
    <VisualAdminFrame>
      {await NewRedirectPage({ searchParams: Promise.resolve({}) })}
    </VisualAdminFrame>
  );
}
