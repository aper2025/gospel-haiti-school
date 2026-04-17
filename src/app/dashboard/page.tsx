import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import {
  Users, ClipboardCheck, BookOpen, ShieldAlert, Clock, Wallet,
  UserCog, BarChart3, AlertTriangle, TrendingUp,
} from "lucide-react";
import { DailySummary } from "./daily-summary";
import { DashboardCharts } from "./dashboard-charts";

export default async function DashboardHome() {
  const user = await requireAuth();
  const t = await getTranslations();
  const isAdmin = hasRole(user, "DIRECTOR", "ADMIN");

  const today = new Date();
  const dateOnly = new Date(today.toISOString().split("T")[0]);

  const totalStudents = await prisma.student.count({ where: { enrollmentStatus: "ACTIVE" } });
  const attendanceToday = await prisma.attendance.count({ where: { date: dateOnly } });
  const presentToday = await prisma.attendance.count({ where: { date: dateOnly, code: "P" } });
  const attendanceRate = attendanceToday > 0 ? Math.round((presentToday / attendanceToday) * 100) : 0;
  const behaviorFlags = await prisma.student.count({
    where: { enrollmentStatus: "ACTIVE", currentBehaviorLevel: { in: ["L3", "L4", "L5", "L6"] } },
  });
  const staffSignedIn = await prisma.timeClockEntry.count({ where: { date: dateOnly, signInAt: { not: null } } });
  const totalStaff = await prisma.staff.count({ where: { active: true } });
  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { id: true },
  });
  const unreadNotifs = profile
    ? await prisma.notification.count({ where: { recipientId: profile.id, readAt: null } })
    : 0;

  let overdueCount = 0;
  let outstandingTotal = 0;
  if (isAdmin) {
    overdueCount = await prisma.feeAccount.count({
      where: { status: { in: ["UNPAID", "OVERDUE"] } },
    });
    const accounts = await prisma.feeAccount.findMany({
      where: { status: { in: ["UNPAID", "OVERDUE", "PARTIAL"] } },
      select: { totalOwed: true, totalPaid: true },
    });
    outstandingTotal = accounts.reduce((s, a) => s + Number(a.totalOwed) - Number(a.totalPaid), 0);
  }

  const retentionWatchCount = await prisma.retentionWatch.count({ where: { resolvedAt: null } });

  const day = today.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setUTCDate(monday.getUTCDate() - diff);
  const weekStart = new Date(monday.toISOString().split("T")[0]);

  const placements = await prisma.weeklyGroupPlacement.findMany({
    where: { weekStart },
    select: { group: true },
  });
  const groupDist = { G1: 0, G2: 0, G3: 0, G4: 0 };
  for (const p of placements) {
    if (p.group in groupDist) groupDist[p.group as keyof typeof groupDist]++;
  }

  // ── Daily Summary: Staff time clock ──
  const allStaff = await prisma.staff.findMany({
    where: { active: true },
    orderBy: [{ lastName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });

  const todayClockEntries = await prisma.timeClockEntry.findMany({
    where: { date: dateOnly },
    include: { staff: { select: { firstName: true, lastName: true } } },
    orderBy: { signInAt: "asc" },
  });

  const clockedStaffIds = new Set(todayClockEntries.map((e) => e.staffId));
  const staffEntries = todayClockEntries.map((e) => ({
    name: `${e.staff.firstName} ${e.staff.lastName}`,
    signInAt: e.signInAt?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) ?? null,
    signOutAt: e.signOutAt?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) ?? null,
    hoursWorked: e.hoursWorked ? Number(e.hoursWorked) : null,
  }));
  const notSignedInStaff = allStaff
    .filter((s) => !clockedStaffIds.has(s.id))
    .map((s) => `${s.firstName} ${s.lastName}`);

  const staffSummary = {
    total: totalStaff,
    signedIn: staffSignedIn,
    signedOut: todayClockEntries.filter((e) => e.signOutAt).length,
    missing: totalStaff - staffSignedIn,
    lateCount: 0, // Would need school start time comparison
    entries: staffEntries,
    notSignedIn: notSignedInStaff,
  };

  // ── Daily Summary: Per-class data ──
  const allClasses = await prisma.class.findMany({
    where: { excluded: false },
    orderBy: { orderIdx: "asc" },
    select: { id: true, label: true },
  });

  const classSummaries = await Promise.all(
    allClasses.map(async (cls) => {
      const students = await prisma.student.findMany({
        where: { currentClassId: cls.id, enrollmentStatus: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, currentBehaviorLevel: true },
      });
      const studentIds = students.map((s) => s.id);
      const totalStudents = students.length;

      // Attendance
      const attRecords = await prisma.attendance.findMany({
        where: { studentId: { in: studentIds }, date: dateOnly },
        select: { code: true },
      });
      const present = attRecords.filter((a) => a.code === "P").length;
      const late = attRecords.filter((a) => a.code === "L_E" || a.code === "L_U").length;
      const absent = attRecords.filter((a) => a.code === "A_E" || a.code === "A_U").length;
      const unmarked = totalStudents - attRecords.length;

      // Average grade (recent evaluations)
      const evals = await prisma.evaluation.findMany({
        where: { studentId: { in: studentIds } },
        select: { scorePct: true },
        orderBy: { date: "desc" },
        take: 200,
      });
      const avgScore = evals.length > 0
        ? evals.reduce((s, e) => s + e.scorePct, 0) / evals.length
        : null;

      // Behavior flags (L1+)
      const behaviorStudents = students
        .filter((s) => s.currentBehaviorLevel !== "L0")
        .map((s) => ({ name: `${s.firstName} ${s.lastName}`, level: s.currentBehaviorLevel }))
        .sort((a, b) => b.level.localeCompare(a.level));

      return {
        classId: cls.id,
        label: cls.label,
        totalStudents,
        attendance: { present, late, absent, unmarked },
        avgScore,
        behaviorFlags: behaviorStudents.length,
        behaviorStudents,
      };
    }),
  );

  return (
    <div>
      {/* Welcome header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 lg:p-8 text-white shadow-lg shadow-blue-700/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("auth.welcome")}</h1>
            <p className="mt-1 text-blue-100 text-sm">
              {today.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          {unreadNotifs > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {unreadNotifs} notification{unreadNotifs > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Top-level stats inline */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InlineMetric label="Élèves" value={totalStudents} />
          <InlineMetric label="Présence" value={`${attendanceRate}%`} />
          <InlineMetric label="Personnel" value={`${staffSignedIn}/${totalStaff}`} />
          <InlineMetric label="Alertes" value={behaviorFlags + retentionWatchCount} />
        </div>
      </div>

      {/* Daily Summary */}
      <DailySummary staffSummary={staffSummary} classSummaries={classSummaries} />

      {/* Charts */}
      <DashboardCharts
        attendanceByClass={classSummaries.map((c) => ({
          label: c.label,
          present: c.attendance.present,
          absent: c.attendance.absent,
          late: c.attendance.late,
        }))}
        groupDistribution={[
          { name: "G1 (80%+)", value: groupDist.G1, color: "#10b981" },
          { name: "G2 (70-79%)", value: groupDist.G2, color: "#3b82f6" },
          { name: "G3 (40-69%)", value: groupDist.G3, color: "#f59e0b" },
          { name: "G4 (<40%)", value: groupDist.G4, color: "#ef4444" },
        ]}
        behaviorOverview={["L0", "L1", "L2", "L3", "L4", "L5", "L6"].map((level) => ({
          level,
          count: classSummaries.reduce(
            (sum, c) => sum + c.behaviorStudents.filter((s) => s.level === level).length,
            0,
          ),
        }))}
      />

      {/* Key metrics cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={Users} color="blue"
          label="Élèves actifs" value={String(totalStudents)}
          href="/dashboard/students"
        />
        <MetricCard
          icon={ClipboardCheck} color="emerald"
          label="Présence aujourd'hui" value={`${attendanceRate}%`}
          sub={`${presentToday} sur ${attendanceToday} marqués`}
          href="/dashboard/attendance"
        />
        <MetricCard
          icon={ShieldAlert} color={behaviorFlags > 0 ? "red" : "slate"}
          label="Comportement (L3+)" value={String(behaviorFlags)}
          alert={behaviorFlags > 0}
          href="/dashboard/behavior"
        />
        <MetricCard
          icon={Clock} color="violet"
          label="Personnel sur place" value={`${staffSignedIn}/${totalStaff}`}
          href="/dashboard/time-clock"
        />
        {isAdmin && (
          <>
            <MetricCard
              icon={Wallet} color={overdueCount > 0 ? "orange" : "slate"}
              label="Comptes impayés" value={String(overdueCount)}
              sub={formatHTG(outstandingTotal) + " en attente"}
              alert={overdueCount > 0}
              href="/dashboard/fees"
            />
            <MetricCard
              icon={TrendingUp} color={retentionWatchCount > 0 ? "red" : "slate"}
              label="Surveillance redoublement" value={String(retentionWatchCount)}
              alert={retentionWatchCount > 0}
              href="/dashboard/gradebook"
            />
          </>
        )}
      </div>

      {/* Group distribution */}
      {placements.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Répartition des groupes (cette semaine)
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <GroupCard group="G1" label="En voie" sub="80%+" count={groupDist.G1}
              gradient="from-emerald-500 to-green-600" />
            <GroupCard group="G2" label="À surveiller" sub="70-79%" count={groupDist.G2}
              gradient="from-blue-500 to-cyan-600" />
            <GroupCard group="G3" label="Intervention" sub="40-69%" count={groupDist.G3}
              gradient="from-amber-500 to-orange-600" />
            <GroupCard group="G4" label="Crise" sub="<40%" count={groupDist.G4}
              gradient="from-red-500 to-rose-600" />
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Accès rapide
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { label: t("nav.students"), href: "/dashboard/students", icon: Users },
            { label: t("nav.attendance"), href: "/dashboard/attendance", icon: ClipboardCheck },
            { label: t("nav.gradebook"), href: "/dashboard/gradebook", icon: BookOpen },
            { label: t("nav.behavior"), href: "/dashboard/behavior", icon: ShieldAlert },
            { label: t("nav.timeClock"), href: "/dashboard/time-clock", icon: Clock },
            ...(isAdmin
              ? [
                  { label: t("nav.fees"), href: "/dashboard/fees", icon: Wallet },
                  { label: t("nav.staff"), href: "/dashboard/staff", icon: UserCog },
                  { label: t("nav.reports"), href: "/dashboard/reports", icon: BarChart3 },
                ]
              : []),
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="card-hover group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
              >
                <Icon className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InlineMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-blue-200 mt-0.5">{label}</p>
    </div>
  );
}

const COLOR_MAP: Record<string, { bg: string; iconBg: string; icon: string; border: string }> = {
  blue:    { bg: "bg-white", iconBg: "bg-blue-50", icon: "text-blue-600", border: "border-slate-200" },
  emerald: { bg: "bg-white", iconBg: "bg-emerald-50", icon: "text-emerald-600", border: "border-slate-200" },
  red:     { bg: "bg-red-50/50", iconBg: "bg-red-100", icon: "text-red-600", border: "border-red-200" },
  orange:  { bg: "bg-orange-50/50", iconBg: "bg-orange-100", icon: "text-orange-600", border: "border-orange-200" },
  violet:  { bg: "bg-white", iconBg: "bg-violet-50", icon: "text-violet-600", border: "border-slate-200" },
  slate:   { bg: "bg-white", iconBg: "bg-slate-50", icon: "text-slate-500", border: "border-slate-200" },
};

function MetricCard({
  icon: Icon,
  color,
  label,
  value,
  sub,
  alert,
  href,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  href: string;
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.slate;
  return (
    <Link
      href={href}
      className={`card-hover rounded-2xl border ${c.border} ${c.bg} p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.iconBg}`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
        {alert && (
          <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </Link>
  );
}

function GroupCard({ group, label, sub, count, gradient }: {
  group: string; label: string; sub: string; count: number; gradient: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}>
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-sm font-semibold mt-1">{group} — {label}</p>
      <p className="text-xs text-white/70">{sub}</p>
    </div>
  );
}

function formatHTG(amount: number): string {
  return new Intl.NumberFormat("fr-HT", {
    style: "currency",
    currency: "HTG",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
