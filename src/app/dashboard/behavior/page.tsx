import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { BehaviorFilters } from "./behavior-filters";
import { NewIncidentDialog } from "./new-incident-dialog";

export default async function BehaviorPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; level?: string; q?: string }>;
}) {
  const user = await requireAuth();
  const t = await getTranslations();
  const params = await searchParams;

  const classes = await prisma.class.findMany({
    where: { excluded: false },
    orderBy: { orderIdx: "asc" },
    select: { id: true, label: true },
  });

  // Build filter
  const studentWhere: Record<string, unknown> = { enrollmentStatus: "ACTIVE" };
  if (params.class) studentWhere.currentClassId = params.class;
  if (params.level) studentWhere.currentBehaviorLevel = params.level;
  if (params.q) {
    studentWhere.OR = [
      { firstName: { contains: params.q, mode: "insensitive" } },
      { lastName: { contains: params.q, mode: "insensitive" } },
    ];
  }

  // Students with level > L0 first, then alphabetical
  const students = await prisma.student.findMany({
    where: studentWhere,
    include: { currentClass: true },
    orderBy: [{ currentBehaviorLevel: "desc" }, { lastName: "asc" }],
  });

  // Recent incidents
  const recentIncidents = await prisma.behaviorIncident.findMany({
    where: params.class
      ? { student: { currentClassId: params.class } }
      : undefined,
    include: {
      student: { select: { firstName: true, lastName: true } },
      teacher: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: "desc" },
    take: 20,
  });

  // Students list for the new incident form
  const allActiveStudents = await prisma.student.findMany({
    where: { enrollmentStatus: "ACTIVE" },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          {t("nav.behavior")}
        </h1>
        <NewIncidentDialog
          students={allActiveStudents}
          translations={{
            add: t("common.add"),
            save: t("common.save"),
            cancel: t("common.cancel"),
            loading: t("common.loading"),
          }}
        />
      </div>

      <BehaviorFilters
        classes={classes}
        current={params}
        translations={{ search: t("common.search") }}
      />

      {/* Level summary cards — clickable to filter */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {["L0", "L1", "L2", "L3", "L4", "L5", "L6"].map((lvl) => {
          const count = students.filter(
            (s) => s.currentBehaviorLevel === lvl,
          ).length;
          const isSelected = params.level === lvl;
          const colors: Record<string, string> = {
            L0: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
            L1: "border-blue-200 bg-blue-50 hover:bg-blue-100",
            L2: "border-amber-200 bg-amber-50 hover:bg-amber-100",
            L3: "border-orange-200 bg-orange-50 hover:bg-orange-100",
            L4: "border-red-200 bg-red-50 hover:bg-red-100",
            L5: "border-red-300 bg-red-100 hover:bg-red-200",
            L6: "border-red-400 bg-red-200 hover:bg-red-300",
          };
          return (
            <Link
              key={lvl}
              href={isSelected ? "/dashboard/behavior" : `/dashboard/behavior?level=${lvl}`}
              className={`card-hover rounded-xl border p-3 text-center transition-all ${colors[lvl]} ${
                isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
              }`}
            >
              <p className="text-xl font-bold text-slate-900">{count}</p>
              <p className="text-xs font-medium text-slate-600">{lvl}</p>
            </Link>
          );
        })}
      </div>

      {/* Students at selected level */}
      {params.level && (() => {
        const filtered = students.filter((s) => s.currentBehaviorLevel === params.level);
        if (!filtered.length) return null;
        return (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              Élèves au {params.level} ({filtered.length})
            </h2>
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              {filtered.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <Link
                      href={`/dashboard/students/${s.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-blue-700"
                    >
                      {s.lastName}, {s.firstName}
                    </Link>
                    <span className="ml-2 text-xs text-slate-500">
                      {s.currentClass?.label}
                    </span>
                  </div>
                  <LevelBadge level={s.currentBehaviorLevel} />
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Students at L3+ */}
      {(() => {
        const flagged = students.filter((s) =>
          ["L3", "L4", "L5", "L6"].includes(s.currentBehaviorLevel),
        );
        if (!flagged.length) return null;
        return (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              Élèves signalés (Niveau 3+)
            </h2>
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              {flagged.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <Link
                      href={`/dashboard/students/${s.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-blue-700"
                    >
                      {s.lastName}, {s.firstName}
                    </Link>
                    <span className="ml-2 text-xs text-slate-500">
                      {s.currentClass?.label}
                    </span>
                  </div>
                  <LevelBadge level={s.currentBehaviorLevel} />
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Recent incidents log */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          {t("behavior.incidentLog")}
        </h2>
        {recentIncidents.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">{t("common.noData")}</p>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {recentIncidents.map((inc) => (
              <div key={inc.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LevelBadge level={inc.level} />
                    <span className="text-sm font-medium text-slate-900">
                      {inc.student.lastName}, {inc.student.firstName}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {inc.date.toLocaleDateString("fr-FR", { timeZone: "UTC" })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                  {inc.description}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Par {inc.teacher.firstName} {inc.teacher.lastName}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    L0: "bg-green-100 text-green-800",
    L1: "bg-blue-100 text-blue-800",
    L2: "bg-amber-100 text-amber-800",
    L3: "bg-orange-100 text-orange-800",
    L4: "bg-red-100 text-red-800",
    L5: "bg-red-200 text-red-900",
    L6: "bg-red-300 text-red-950",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[level] ?? ""}`}>
      {level}
    </span>
  );
}
