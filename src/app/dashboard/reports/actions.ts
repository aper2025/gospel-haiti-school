"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";
import { computeLetterGrade, computeGroup } from "@/lib/schemas/evaluation";

const trimestreSchema = z.object({
  number: z.enum(["T1", "T2", "T3"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export async function upsertTrimestre(formData: FormData) {
  await requireRole("DIRECTOR", "ADMIN");

  const raw = Object.fromEntries(formData.entries());
  const parsed = trimestreSchema.safeParse(raw);
  if (!parsed.success) return { error: "validation" };

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return { error: "no_active_year" };

  await prisma.trimestre.upsert({
    where: { yearId_number: { yearId: activeYear.id, number: parsed.data.number as never } },
    update: {
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
    create: {
      yearId: activeYear.id,
      number: parsed.data.number as never,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
  });

  revalidatePath("/dashboard/reports");
  return { ok: true };
}

export async function generateReportCard(studentId: string, trimestreId: string) {
  await requireRole("DIRECTOR", "ADMIN");

  const trimestre = await prisma.trimestre.findUnique({
    where: { id: trimestreId },
    include: { year: true },
  });
  if (!trimestre) return { error: "trimestre_not_found" };

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, firstName: true, lastName: true, currentBehaviorLevel: true },
  });
  if (!student) return { error: "student_not_found" };

  // Get all evaluations for this student within the trimestre date range
  const evaluations = await prisma.evaluation.findMany({
    where: {
      studentId,
      date: { gte: trimestre.startDate, lte: trimestre.endDate },
    },
  });

  // Group by subject and compute averages
  const bySubject: Record<string, number[]> = {};
  for (const ev of evaluations) {
    if (!bySubject[ev.subject]) bySubject[ev.subject] = [];
    bySubject[ev.subject].push(ev.scorePct);
  }

  // Create or update report card
  const reportCard = await prisma.reportCard.upsert({
    where: { studentId_trimestreId: { studentId, trimestreId } },
    update: { updatedAt: new Date() },
    create: { studentId, trimestreId },
  });

  // Delete old entries and recreate
  await prisma.reportCardEntry.deleteMany({ where: { reportCardId: reportCard.id } });

  for (const [subject, scores] of Object.entries(bySubject)) {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    await prisma.reportCardEntry.create({
      data: {
        reportCardId: reportCard.id,
        subject: subject as never,
        trimestreAvg: Math.round(avg * 100) / 100,
        letter: computeLetterGrade(avg) as never,
        group: computeGroup(avg) as never,
      },
    });
  }

  // Attendance summary for the trimestre
  const attendance = await prisma.attendance.findMany({
    where: {
      studentId,
      date: { gte: trimestre.startDate, lte: trimestre.endDate },
    },
    select: { code: true },
  });

  const attSummary = {
    present: attendance.filter((a) => a.code === "P").length,
    lateExcused: attendance.filter((a) => a.code === "L_E").length,
    lateUnexcused: attendance.filter((a) => a.code === "L_U").length,
    absentExcused: attendance.filter((a) => a.code === "A_E").length,
    absentUnexcused: attendance.filter((a) => a.code === "A_U").length,
  };

  // Behavior summary
  const incidents = await prisma.behaviorIncident.findMany({
    where: {
      studentId,
      date: { gte: trimestre.startDate, lte: trimestre.endDate },
    },
  });

  const behSummary = {
    incidentCount: incidents.length,
    currentLevel: student.currentBehaviorLevel,
  };

  // Cumulative average (all subjects this trimestre)
  const allScores = Object.values(bySubject).flat();
  const cumAvg = allScores.length > 0
    ? Math.round((allScores.reduce((s, v) => s + v, 0) / allScores.length) * 100) / 100
    : null;

  await prisma.reportCard.update({
    where: { id: reportCard.id },
    data: {
      attendanceSummary: attSummary,
      behaviorSummary: behSummary,
      cumulativeAvg: cumAvg,
      generatedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/reports");
  return { ok: true, reportCardId: reportCard.id };
}

export async function generateClassReportCards(classId: string, trimestreId: string) {
  await requireRole("DIRECTOR", "ADMIN");

  const students = await prisma.student.findMany({
    where: { currentClassId: classId, enrollmentStatus: "ACTIVE" },
    select: { id: true },
  });

  const results: { studentId: string; ok: boolean }[] = [];
  for (const s of students) {
    const result = await generateReportCard(s.id, trimestreId);
    results.push({ studentId: s.id, ok: !result.error });
  }

  revalidatePath("/dashboard/reports");
  return { generated: results.filter((r) => r.ok).length, total: students.length };
}

export async function generateTranscript(studentId: string) {
  const user = await requireRole("DIRECTOR", "ADMIN");

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!student) return { error: "student_not_found" };

  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { id: true },
  });
  if (!profile) return { error: "no_profile" };

  // Gather all report cards across all trimestres/years
  const reportCards = await prisma.reportCard.findMany({
    where: { studentId },
    include: {
      trimestre: { include: { year: true } },
      entries: true,
    },
    orderBy: { trimestre: { year: { startDate: "asc" } } },
  });

  // Build academic history structure
  const yearMap: Record<string, { year: string; trimestres: Record<string, Record<string, number>> }> = {};

  for (const rc of reportCards) {
    const yearLabel = rc.trimestre.year.label;
    if (!yearMap[yearLabel]) {
      yearMap[yearLabel] = { year: yearLabel, trimestres: {} };
    }
    const tNum = rc.trimestre.number;
    yearMap[yearLabel].trimestres[tNum] = {};
    for (const entry of rc.entries) {
      yearMap[yearLabel].trimestres[tNum][entry.subject] = entry.trimestreAvg;
    }
  }

  const academicHistory = Object.values(yearMap);

  // Get retention records
  const retentions = await prisma.gradeRetention.findMany({
    where: { studentId },
    select: { yearLabel: true, classCode: true, reason: true },
  });

  const retentionNotes = retentions.length > 0
    ? retentions.map((r) => `${r.yearLabel} (${r.classCode}): ${r.reason ?? "—"}`).join("\n")
    : null;

  const transcript = await prisma.transcript.create({
    data: {
      studentId,
      title: `Relevé de notes — ${student.firstName} ${student.lastName}`,
      academicHistory,
      retentionNotes,
      generatedById: profile.id,
    },
  });

  revalidatePath("/dashboard/reports");
  return { ok: true, transcriptId: transcript.id };
}
