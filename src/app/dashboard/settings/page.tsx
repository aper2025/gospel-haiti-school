import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { LanguageToggle } from "./language-toggle";
import { SchoolYearManager } from "./school-year-manager";
import { UserManager } from "./user-manager";

export default async function SettingsPage() {
  const user = await requireRole("DIRECTOR", "ADMIN");
  const t = await getTranslations();

  const schoolYears = await prisma.schoolYear.findMany({
    orderBy: { startDate: "desc" },
  });

  const profiles = await prisma.userProfile.findMany({
    include: { staff: { select: { firstName: true, lastName: true } } },
    orderBy: { email: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">{t("nav.settings")}</h1>

      {/* Language */}
      <Section title="Langue / Language">
        <LanguageToggle />
      </Section>

      {/* School years */}
      <Section title="Années scolaires">
        <div className="space-y-2 mb-4">
          {schoolYears.map((y) => (
            <div key={y.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
              <span className="text-slate-900 font-medium">{y.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {y.startDate.toLocaleDateString("fr-FR")} — {y.endDate.toLocaleDateString("fr-FR")}
                </span>
                {y.isActive && (
                  <span className="inline-flex rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-xs font-medium">
                    Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <SchoolYearManager translations={{ save: t("common.save"), loading: t("common.loading") }} />
      </Section>

      {/* User accounts */}
      <Section title="Comptes utilisateurs">
        <div className="space-y-2 mb-4">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
              <div>
                <span className="text-slate-900 font-medium">{p.email}</span>
                {p.staff && (
                  <span className="text-slate-500 ml-2">
                    ({p.staff.firstName} {p.staff.lastName})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{p.role}</span>
                {!p.active && (
                  <span className="inline-flex rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-xs font-medium">
                    Inactif
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <UserManager translations={{ save: t("common.save"), loading: t("common.loading") }} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}
