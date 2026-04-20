import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { haitiDateOnly, haitiWeekStart, formatDateFR, formatTimeFR } from "@/lib/timezone";
import { TrimestreForm } from "./trimestre-form";
import { BatchGenerateButton } from "./batch-generate-button";
import { TranscriptButton } from "./transcript-button";
import { ReportFilter } from "./report-filter";
import { WeeklyForm } from "../weekly-report/weekly-form";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; trimestre?: string; class?: string; week?: string }>;
}) {
  const user = await requireRole("DIRECTOR", "ADMIN");
  const t = await getTranslations();
  const params = await searchParams;
  const tab = params.tab || "daily";

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  const today = new Date();
  const dateOnly = haitiDateOnly();

  const classes = await prisma.class.findMany({
    where: { excluded: false },
    orderBy: { orderIdx: "asc" },
    select: { id: true, label: true, code: true },
  });

  const trimestres = activeYear
    ? await prisma.trimestre.findMany({
        where: { yearId: activeYear.id },
        orderBy: { number: "asc" },
      })
    : [];

  // ── Daily report data ──
  const attendanceToday = await prisma.attendance.findMany({
    where: { date: dateOnly },
    include: {
      student: { select: { firstName: true, lastName: true, currentClass: { select: { label: true } } } },
    },
    orderBy: { student: { lastName: "asc" } },
  });

  const absentToday = attendanceToday.filter((a) => a.code === "A_E" || a.code === "A_U");
  const lateToday = attendanceToday.filter((a) => a.code === "L_E" || a.code === "L_U");

  const staffToday = await prisma.timeClockEntry.findMany({
    where: { date: dateOnly },
    include: { staff: { select: { firstName: true, lastName: true } } },
  });

  const behaviorToday = await prisma.behaviorIncident.findMany({
    where: { date: dateOnly },
    include: {
      student: { select: { firstName: true, lastName: true } },
      teacher: { select: { firstName: true, lastName: true } },
    },
  });

  // ── Weekly data ──
  const weekStart = haitiWeekStart();
  const selectedWeek = params.week || weekStart;

  const weeklySubmissions = activeYear
    ? await prisma.weeklyDataSubmission.findMany({
        where: { yearId: activeYear.id, weekStart: new Date(selectedWeek) },
        include: { teacher: { select: { firstName: true, lastName: true } } },
        orderBy: { classCode: "asc" },
      })
    : [];

  const elementary = weeklySubmissions.filter((s) =>
    ["KG2", "KG3", "F1", "F2", "F3", "F4"].includes(s.classCode),
  );
  const secondary = weeklySubmissions.filter((s) =>
    ["F5", "F6", "F7", "F8", "F9"].includes(s.classCode),
  );

  // ── Monthly data (based on Haiti date) ──
  const haitiDate = new Date(haitiDateOnly());
  const monthStart = new Date(Date.UTC(haitiDate.getUTCFullYear(), haitiDate.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(haitiDate.getUTCFullYear(), haitiDate.getUTCMonth() + 1, 0));

  const monthlyAttendance = await prisma.attendance.groupBy({
    by: ["code"],
    where: { date: { gte: monthStart, lte: monthEnd } },
    _count: true,
  });

  const monthlyPayments = await prisma.payment.aggregate({
    where: { date: { gte: monthStart, lte: monthEnd } },
    _sum: { amountHtg: true },
    _count: true,
  });

  // ── Report cards (trimestre tab) ──
  const selectedTrimestreId = params.trimestre || trimestres[0]?.id || null;
  const selectedClassId = params.class || classes[0]?.id || null;

  let reportCards: {
    id: string;
    cumulativeAvg: number | null;
    generatedAt: Date | null;
    student: { firstName: string; lastName: string };
    entries: { subject: string; trimestreAvg: number; letter: string; group: string }[];
  }[] = [];

  if (tab === "trimestre" && selectedTrimestreId && selectedClassId) {
    reportCards = await prisma.reportCard.findMany({
      where: {
        trimestreId: selectedTrimestreId,
        student: { currentClassId: selectedClassId },
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        entries: { orderBy: { subject: "asc" } },
      },
      orderBy: { student: { lastName: "asc" } },
    });
  }

  // Students for transcript
  const students = await prisma.student.findMany({
    where: { enrollmentStatus: "ACTIVE" },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, currentClass: { select: { label: true } } },
  });

  // Available class codes for weekly form
  const classCodes = classes.map((c) => c.code);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{t("nav.reports")}</h1>

      {/* Tabs */}
      <div className="mt-4 flex flex-wrap gap-1 border-b border-slate-200">
        {[
          { key: "daily", label: "Quotidien" },
          { key: "weekly", label: "Hebdomadaire" },
          { key: "monthly", label: "Mensuel" },
          { key: "trimestre", label: "Trimestre / Bulletins" },
          { key: "transcripts", label: "Relevés" },
        ].map((tb) => (
          <Link key={tb.key} href={`/dashboard/reports?tab=${tb.key}`}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === tb.key ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            {tb.label}
          </Link>
        ))}
      </div>

      {/* ── DAILY ── */}
      {tab === "daily" && (
        <div className="mt-4 space-y-6">
          <p className="text-sm text-slate-500">
            {formatDateFR(today, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Présences marquées" value={attendanceToday.length} />
            <StatCard label="Absents" value={absentToday.length} alert={absentToday.length > 0} />
            <StatCard label="Retards" value={lateToday.length} />
          </div>

          {absentToday.length > 0 && (
            <Section title="Absents aujourd'hui">
              {absentToday.map((a) => (
                <div key={a.id} className="flex justify-between py-1.5 text-sm">
                  <span className="text-slate-900">{a.student.lastName}, {a.student.firstName}</span>
                  <span className="text-slate-500">{a.student.currentClass?.label} — {a.code === "A_E" ? "Justifié" : "Non justifié"}</span>
                </div>
              ))}
            </Section>
          )}

          {lateToday.length > 0 && (
            <Section title="Retards aujourd'hui">
              {lateToday.map((a) => (
                <div key={a.id} className="flex justify-between py-1.5 text-sm">
                  <span className="text-slate-900">{a.student.lastName}, {a.student.firstName}</span>
                  <span className="text-slate-500">{a.student.currentClass?.label}</span>
                </div>
              ))}
            </Section>
          )}

          <Section title={`Personnel pointé (${staffToday.length})`}>
            {staffToday.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun pointage</p>
            ) : (
              staffToday.map((e) => (
                <div key={e.id} className="flex justify-between py-1.5 text-sm">
                  <span className="text-slate-900">{e.staff.lastName}, {e.staff.firstName}</span>
                  <span className="text-slate-500">
                    {e.signInAt ? formatTimeFR(e.signInAt) : ""}
                    {e.signOutAt && ` — ${formatTimeFR(e.signOutAt)}`}
                  </span>
                </div>
              ))
            )}
          </Section>

          {behaviorToday.length > 0 && (
            <Section title="Incidents de comportement">
              {behaviorToday.map((b) => (
                <div key={b.id} className="py-1.5 text-sm">
                  <span className="font-medium text-slate-900">{b.student.lastName}, {b.student.firstName}</span>
                  <span className="text-slate-500 ml-2">({b.level})</span>
                  <p className="text-slate-600 text-xs mt-0.5">{b.description}</p>
                </div>
              ))}
            </Section>
          )}
        </div>
      )}

      {/* ── WEEKLY ── */}
      {tab === "weekly" && (
        <div className="mt-4 space-y-6">
          <WeeklyForm classCodes={classCodes} weekStart={selectedWeek}
            translations={{ save: t("common.save"), loading: t("common.loading") }} />

          {elementary.length > 0 && (
            <MeetingSection title="Élémentaire (KG2–4F) — Mercredi 15h" submissions={elementary} />
          )}
          {secondary.length > 0 && (
            <MeetingSection title="Secondaire (5F–9F) — Jeudi 15h" submissions={secondary} />
          )}
          {weeklySubmissions.length === 0 && (
            <p className="text-sm text-slate-400 py-4 text-center">Aucune soumission pour cette semaine.</p>
          )}
        </div>
      )}

      {/* ── MONTHLY ── */}
      {tab === "monthly" && (
        <div className="mt-4 space-y-6">
          <p className="text-sm text-slate-500">
            {formatDateFR(today, { month: "long", year: "numeric" })}
          </p>

          <Section title="Présence ce mois">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {monthlyAttendance.map((a) => (
                <div key={a.code} className="rounded-lg border border-slate-100 p-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{a._count}</p>
                  <p className="text-xs text-slate-500">{a.code.replace("_", " ")}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Paiements ce mois">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-100 p-3 text-center">
                <p className="text-lg font-bold text-slate-900">{monthlyPayments._count}</p>
                <p className="text-xs text-slate-500">Transactions</p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3 text-center">
                <p className="text-lg font-bold text-slate-900">
                  {new Intl.NumberFormat("fr-HT", { style: "currency", currency: "HTG", minimumFractionDigits: 0 }).format(Number(monthlyPayments._sum.amountHtg ?? 0))}
                </p>
                <p className="text-xs text-slate-500">Total perçu</p>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── TRIMESTRE / REPORT CARDS ── */}
      {tab === "trimestre" && (
        <div className="mt-4 space-y-6">
          {trimestres.length === 0 ? (
            <div>
              <p className="text-sm text-slate-400 py-4 text-center mb-4">
                Définissez les trimestres d'abord.
              </p>
              <TrimestreForm translations={{ save: t("common.save"), loading: t("common.loading") }} />
            </div>
          ) : (
            <>
              <TrimestreForm translations={{ save: t("common.save"), loading: t("common.loading") }} />

              <div className="flex flex-wrap items-end gap-3">
                <ReportFilter label="Trimestre" param="trimestre" current={selectedTrimestreId}
                  options={trimestres.map((tr) => ({ value: tr.id, label: tr.number }))} />
                <ReportFilter label="Classe" param="class" current={selectedClassId}
                  options={classes.map((c) => ({ value: c.id, label: c.label }))} />
                {selectedClassId && selectedTrimestreId && (
                  <BatchGenerateButton classId={selectedClassId} trimestreId={selectedTrimestreId}
                    translations={{ generate: "Générer la classe", loading: t("common.loading") }} />
                )}
              </div>

              {reportCards.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Élève</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Moy.</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Matières</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Généré</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportCards.map((rc) => (
                        <tr key={rc.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {rc.student.lastName}, {rc.student.firstName}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {rc.cumulativeAvg != null ? `${rc.cumulativeAvg.toFixed(1)}%` : "—"}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">{rc.entries.length}</td>
                          <td className="px-4 py-3 text-center text-xs text-slate-500">
                            {rc.generatedAt ? formatDateFR(rc.generatedAt) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TRANSCRIPTS ── */}
      {tab === "transcripts" && (
        <div className="mt-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Élève</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 hidden sm:table-cell">Classe</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{s.lastName}, {s.firstName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">{s.currentClass?.label ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <TranscriptButton studentId={s.id} translations={{ generate: "Générer", loading: t("common.loading") }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${alert ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
      <p className="text-xs font-medium text-slate-500 uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${alert ? "text-red-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">{title}</h2>
      {children}
    </div>
  );
}


function MeetingSection({ title, submissions }: {
  title: string;
  submissions: {
    classCode: string;
    teacher: { firstName: string; lastName: string };
    totalStudents: number;
    group1Count: number; group2Count: number; group3Count: number; group4Count: number;
    group3And4Names: string | null; problematicSubjects: string | null;
    rootCauseAnalysis: string | null; actionPlan: string | null;
    behaviorIssues: string | null; notes: string | null;
  }[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">{title}</h2>
      <div className="space-y-3">
        {submissions.map((sub) => (
          <div key={sub.classCode} className="border-b border-slate-100 pb-3 last:border-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">{sub.classCode}</span>
              <span className="text-xs text-slate-500">{sub.teacher.firstName} {sub.teacher.lastName}</span>
            </div>
            <div className="flex gap-2 text-xs mt-1">
              <span className="rounded bg-green-100 px-2 py-0.5">G1: {sub.group1Count}</span>
              <span className="rounded bg-blue-100 px-2 py-0.5">G2: {sub.group2Count}</span>
              <span className="rounded bg-amber-100 px-2 py-0.5">G3: {sub.group3Count}</span>
              <span className="rounded bg-red-100 px-2 py-0.5">G4: {sub.group4Count}</span>
            </div>
            {sub.group3And4Names && <p className="text-xs text-slate-600 mt-1">G3/G4: {sub.group3And4Names}</p>}
            {sub.actionPlan && <p className="text-xs text-slate-600 mt-1">Plan: {sub.actionPlan}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
