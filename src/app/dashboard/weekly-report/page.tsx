import { redirect } from "next/navigation";

export default function WeeklyReportPage() {
  redirect("/dashboard/reports?tab=weekly");
}
