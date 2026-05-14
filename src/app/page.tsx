import { redirect } from "next/navigation";
import { ADMIN_DASHBOARD_PATH } from "@/lib/admin-routes";

export default function Home() {
  redirect(ADMIN_DASHBOARD_PATH);
}
