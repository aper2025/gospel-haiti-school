import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { AttendanceView } from "./attendance-view";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; date?: string }>;
}) {
  const user = await requireAuth();
  const t = await getTranslations();
  const params = await searchParams;

  const today = new Date().toISOString().split("T")[0];
  const selectedDate = params.date || today;

  // Get user's staff record for staffId
  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });

  // Get classes this user can mark attendance for
  let classes: { id: string; label: string; code: string }[];
  if (user.role === "DIRECTOR" || user.role === "ADMIN") {
    classes = await prisma.class.findMany({
      where: { excluded: false },
      orderBy: { orderIdx: "asc" },
      select: { id: true, label: true, code: true },
    });
  } else if (profile?.staffId) {
    const assignments = await prisma.staffAssignment.findMany({
      where: { staffId: profile.staffId, isHomeroom: true },
      select: { classId: true },
    });
    const classIds = assignments.map((a) => a.classId);
    classes = await prisma.class.findMany({
      where: { id: { in: classIds }, excluded: false },
      orderBy: { orderIdx: "asc" },
      select: { id: true, label: true, code: true },
    });
  } else {
    classes = [];
  }

  const selectedClassId = params.class || classes[0]?.id || null;

  // Get students and existing attendance for the selected class+date
  let students: { id: string; firstName: string; lastName: string }[] = [];
  let existing: Record<string, { code: string; notes: string | null }> = {};

  if (selectedClassId) {
    students = await prisma.student.findMany({
      where: { currentClassId: selectedClassId, enrollmentStatus: "ACTIVE" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    });

    const records = await prisma.attendance.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        date: new Date(selectedDate),
      },
      select: { studentId: true, code: true, notes: true },
    });

    existing = Object.fromEntries(
      records.map((r) => [r.studentId, { code: r.code, notes: r.notes }]),
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        {t("nav.attendance")}
      </h1>

      <AttendanceView
        classes={classes}
        students={students}
        existing={existing}
        selectedClassId={selectedClassId}
        selectedDate={selectedDate}
        staffId={profile?.staffId ?? null}
        translations={{
          present: t("attendance.codes.P"),
          lateExcused: t("attendance.codes.L_E"),
          lateUnexcused: t("attendance.codes.L_U"),
          absentExcused: t("attendance.codes.A_E"),
          absentUnexcused: t("attendance.codes.A_U"),
          save: t("common.save"),
          loading: t("common.loading"),
          offlineMode: t("attendance.offlineMode"),
          pendingSync: t("attendance.pendingSync"),
          noData: t("common.noData"),
          markAll: t("attendance.markAll"),
        }}
      />
    </div>
  );
}
