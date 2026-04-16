"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  evaluationSchema,
  computeLetterGrade,
  computeGroup,
  weekStartOf,
} from "@/lib/schemas/evaluation";

export async function createEvaluation(formData: FormData) {
  const user = await requireAuth();

  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });
  if (!profile?.staffId) return { error: "no_staff_record" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = evaluationSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "validation", details: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const letter = computeLetterGrade(d.scorePct);
  const group = computeGroup(d.scorePct);
  const weekStart = weekStartOf(d.date);

  await prisma.evaluation.create({
    data: {
      studentId: d.studentId,
      subject: d.subject as never,
      type: d.type as never,
      scorePct: d.scorePct,
      letter: letter as never,
      group: group as never,
      date: new Date(d.date),
      weekStart: new Date(weekStart),
      notes: d.notes || null,
      enteredById: profile.staffId,
      clientUuid: `eval-${d.studentId}-${d.date}-${Date.now()}`,
      syncedAt: new Date(),
    },
  });

  // Recompute weekly placement for this student+subject+week
  await recomputeWeeklyPlacement(d.studentId, d.subject, weekStart);

  revalidatePath("/dashboard/gradebook");
  return { ok: true };
}

export async function createBulkEvaluations(
  classId: string,
  subject: string,
  type: string,
  date: string,
  scores: { studentId: string; scorePct: number }[],
) {
  const user = await requireAuth();

  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });
  if (!profile?.staffId) return { error: "no_staff_record" };

  const weekStart = weekStartOf(date);

  for (const s of scores) {
    if (s.scorePct < 0 || s.scorePct > 100) continue;

    const letter = computeLetterGrade(s.scorePct);
    const group = computeGroup(s.scorePct);

    await prisma.evaluation.create({
      data: {
        studentId: s.studentId,
        subject: subject as never,
        type: type as never,
        scorePct: s.scorePct,
        letter: letter as never,
        group: group as never,
        date: new Date(date),
        weekStart: new Date(weekStart),
        enteredById: profile.staffId,
        clientUuid: `eval-${s.studentId}-${date}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        syncedAt: new Date(),
      },
    });

    await recomputeWeeklyPlacement(s.studentId, subject, weekStart);
  }

  revalidatePath("/dashboard/gradebook");
  return { ok: true };
}

async function recomputeWeeklyPlacement(
  studentId: string,
  subject: string,
  weekStart: string,
) {
  const evals = await prisma.evaluation.findMany({
    where: {
      studentId,
      subject: subject as never,
      weekStart: new Date(weekStart),
    },
    select: { scorePct: true },
  });

  if (!evals.length) return;

  const avg = evals.reduce((sum, e) => sum + e.scorePct, 0) / evals.length;
  const group = computeGroup(avg);

  await prisma.weeklyGroupPlacement.upsert({
    where: {
      studentId_subject_weekStart: {
        studentId,
        subject: subject as never,
        weekStart: new Date(weekStart),
      },
    },
    update: {
      avgScore: avg,
      group: group as never,
      sampleSize: evals.length,
    },
    create: {
      studentId,
      subject: subject as never,
      weekStart: new Date(weekStart),
      avgScore: avg,
      group: group as never,
      sampleSize: evals.length,
    },
  });
}
