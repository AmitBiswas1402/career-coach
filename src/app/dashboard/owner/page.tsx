import { redirect } from "next/navigation";

export default function DashboardOwnerRedirectPage() {
  redirect("/owner-dashboard");
}
