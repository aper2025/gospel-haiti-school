import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { Sidebar } from "./sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const t = await getTranslations();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} translations={{
        dashboard: t("nav.dashboard"),
        students: t("nav.students"),
        attendance: t("nav.attendance"),
        gradebook: t("nav.gradebook"),
        behavior: t("nav.behavior"),
        fees: t("nav.fees"),
        staff: t("nav.staff"),
        timeClock: t("nav.timeClock"),
        schedules: t("nav.schedules"),
        weeklyReport: t("nav.weeklyReport"),
        reports: t("nav.reports"),
        settings: t("nav.settings"),
        signOut: t("nav.signOut"),
        roleName: t(`roles.${user.role}`),
      }} />
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 lg:p-8">
        <div className="min-h-[calc(100vh-8rem)]">
          {children}
        </div>
        <footer className="mt-12 border-t border-slate-200 pt-4 pb-6 text-center">
          <a
            href="mailto:ap@gospelhaiti.org?subject=GHIS%20Platform%20Suggestion"
            className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
          >
            Suggestions d'amélioration? Contactez-nous
          </a>
        </footer>
      </main>
    </div>
  );
}
