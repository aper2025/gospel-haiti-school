import { prisma } from "@/lib/prisma";
import { TakeAttendanceClient } from "./client";

export const dynamic = "force-dynamic";

export default async function TakeAttendancePage() {
  const classes = await prisma.class.findMany({
    where: { excluded: false },
    orderBy: { orderIdx: "asc" },
    select: { id: true, label: true, code: true },
  });

  const today = new Date();
  const dateOnly = new Date(today.toISOString().split("T")[0]);
  const dateStr = today.toISOString().split("T")[0];

  // Get all students grouped by class
  const students = await prisma.student.findMany({
    where: { enrollmentStatus: "ACTIVE", currentClassId: { not: null } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, currentClassId: true },
  });

  // Get today's existing attendance
  const existing = await prisma.attendance.findMany({
    where: { date: dateOnly },
    select: { studentId: true, code: true },
  });

  const existingMap: Record<string, string> = {};
  for (const a of existing) {
    existingMap[a.studentId] = a.code;
  }

  // Count marked per class
  const classCounts: Record<string, { total: number; marked: number }> = {};
  for (const cls of classes) {
    const classStudents = students.filter((s) => s.currentClassId === cls.id);
    const marked = classStudents.filter((s) => existingMap[s.id]).length;
    classCounts[cls.id] = { total: classStudents.length, marked };
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <TakeAttendanceClient
        classes={classes}
        students={students.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          classId: s.currentClassId!,
        }))}
        existingMarks={existingMap}
        classCounts={classCounts}
        date={dateStr}
        dateDisplay={today.toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />
    </main>
  );
}
