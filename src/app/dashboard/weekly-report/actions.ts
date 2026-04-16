"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const submissionSchema = z.object({
  classCode: z.string().min(1),
  weekStart: z.string().min(1),
  totalStudents: z.coerce.number().int().min(0),
  group1Count: z.coerce.number().int().min(0),
  group2Count: z.coerce.number().int().min(0),
  group3Count: z.coerce.number().int().min(0),
  group4Count: z.coerce.number().int().min(0),
  group3And4Names: z.string().max(2000).optional(),
  problematicSubjects: z.string().max(1000).optional(),
  tutoringAssigned: z.string().max(1000).optional(),
  rootCauseAnalysis: z.string().max(2000).optional(),
  actionPlan: z.string().max(2000).optional(),
  behaviorIssues: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

export async function submitWeeklyData(formData: FormData) {
  const user = await requireAuth();
  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });
  if (!profile?.staffId) return { error: "no_staff_record" };

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return { error: "no_active_year" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) return { error: "validation" };

  const d = parsed.data;

  await prisma.weeklyDataSubmission.upsert({
    where: {
      teacherId_classCode_weekStart: {
        teacherId: profile.staffId,
        classCode: d.classCode as never,
        weekStart: new Date(d.weekStart),
      },
    },
    update: {
      totalStudents: d.totalStudents,
      group1Count: d.group1Count,
      group2Count: d.group2Count,
      group3Count: d.group3Count,
      group4Count: d.group4Count,
      group3And4Names: d.group3And4Names || null,
      problematicSubjects: d.problematicSubjects || null,
      tutoringAssigned: d.tutoringAssigned || null,
      rootCauseAnalysis: d.rootCauseAnalysis || null,
      actionPlan: d.actionPlan || null,
      behaviorIssues: d.behaviorIssues || null,
      notes: d.notes || null,
    },
    create: {
      teacherId: profile.staffId,
      classCode: d.classCode as never,
      yearId: activeYear.id,
      weekStart: new Date(d.weekStart),
      totalStudents: d.totalStudents,
      group1Count: d.group1Count,
      group2Count: d.group2Count,
      group3Count: d.group3Count,
      group4Count: d.group4Count,
      group3And4Names: d.group3And4Names || null,
      problematicSubjects: d.problematicSubjects || null,
      tutoringAssigned: d.tutoringAssigned || null,
      rootCauseAnalysis: d.rootCauseAnalysis || null,
      actionPlan: d.actionPlan || null,
      behaviorIssues: d.behaviorIssues || null,
      notes: d.notes || null,
    },
  });

  revalidatePath("/dashboard/weekly-report");
  return { ok: true };
}
