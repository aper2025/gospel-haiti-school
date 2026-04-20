import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  await requireRole("DIRECTOR", "ADMIN");
  const t = await getTranslations();
  const params = await searchParams;
  const tab = params.tab || "list";

  const staffWhere: Record<string, unknown> = { active: true };
  if (params.q) {
    staffWhere.OR = [
      { firstName: { contains: params.q, mode: "insensitive" } },
      { lastName: { contains: params.q, mode: "insensitive" } },
      { email: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const staff = await prisma.staff.findMany({
    where: staffWhere,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      assignments: {
        include: { class: { select: { label: true } } },
        where: { isHomeroom: true },
        take: 1,
      },
    },
  });

  // Pending leave requests
  const pendingLeaves = await prisma.leaveRequest.findMany({
    where: { status: "PENDING" },
    include: { staff: { select: { firstName: true, lastName: true } } },
    orderBy: { startDate: "asc" },
  });

  // Recent observations
  const recentObs = await prisma.observation.findMany({
    include: {
      staff: { select: { firstName: true, lastName: true } },
      observer: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{t("nav.staff")}</h1>
        <Link
          href="/dashboard/staff/new"
          className="rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
        >
          + {t("common.add")}
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 border-b border-slate-200">
        {[
          { key: "list", label: t("nav.staff") },
          { key: "leave", label: `${t("staff.leave")} (${pendingLeaves.length})` },
          { key: "observations", label: t("staff.observations") },
        ].map((tb) => (
          <Link
            key={tb.key}
            href={`/dashboard/staff?tab=${tb.key}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === tb.key
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tb.label}
          </Link>
        ))}
      </div>

      {tab === "list" && (
        <div className="mt-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 hidden sm:table-cell">Rôle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 hidden md:table-cell">Classe</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Performance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/staff/${s.id}`} className="text-sm font-medium text-slate-900 hover:text-blue-700">
                        {s.lastName}, {s.firstName}
                      </Link>
                      {s.email && <p className="text-xs text-slate-500">{s.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                      {t(`roles.${s.role}`)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                      {s.assignments[0]?.class.label ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PerformanceBadge status={s.performanceStatus} t={t} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/staff/${s.id}`} className="text-sm text-blue-700 hover:text-blue-900">
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "leave" && (
        <div className="mt-4 space-y-3">
          {pendingLeaves.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">{t("common.noData")}</p>
          ) : (
            pendingLeaves.map((lr) => (
              <div key={lr.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {lr.staff.lastName}, {lr.staff.firstName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lr.type} &middot; {lr.startDate.toLocaleDateString("fr-FR", { timeZone: "UTC" })} — {lr.endDate.toLocaleDateString("fr-FR", { timeZone: "UTC" })}
                  </p>
                  {lr.reason && <p className="text-xs text-slate-500 mt-0.5">{lr.reason}</p>}
                </div>
                <div className="flex gap-2">
                  <LeaveAction leaveId={lr.id} action="APPROVED" />
                  <LeaveAction leaveId={lr.id} action="DENIED" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "observations" && (
        <div className="mt-4 space-y-3">
          {recentObs.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">{t("common.noData")}</p>
          ) : (
            recentObs.map((obs) => (
              <div key={obs.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">
                    {obs.staff.lastName}, {obs.staff.firstName}
                  </p>
                  <span className="text-xs text-slate-500">{obs.date.toLocaleDateString("fr-FR", { timeZone: "UTC" })}</span>
                </div>
                {obs.score != null && (
                  <p className="text-xs text-slate-500 mt-1">Score: {obs.score}</p>
                )}
                {obs.strengths && <p className="text-sm text-slate-600 mt-1">{obs.strengths}</p>}
                {obs.improvements && (
                  <p className="text-sm text-amber-700 mt-1">{obs.improvements}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Par {obs.observer.firstName} {obs.observer.lastName}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PerformanceBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const styles: Record<string, string> = {
    STANDARD: "bg-green-50 text-green-700 border-green-200",
    NEEDS_SUPPORT: "bg-amber-50 text-amber-700 border-amber-200",
    PROBATION: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {t(`staff.performance.${status}`)}
    </span>
  );
}

function LeaveAction({ leaveId, action }: { leaveId: string; action: "APPROVED" | "DENIED" }) {
  return (
    <form
      action={async () => {
        "use server";
        const { reviewLeave } = await import("./actions");
        await reviewLeave(leaveId, action);
      }}
    >
      <button
        type="submit"
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          action === "APPROVED"
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-red-100 text-red-700 hover:bg-red-200"
        }`}
      >
        {action === "APPROVED" ? "Approuver" : "Refuser"}
      </button>
    </form>
  );
}
