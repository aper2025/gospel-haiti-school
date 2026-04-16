"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const incidentSchema = z.object({
  studentId: z.string().min(1),
  date: z.string().min(1),
  description: z.string().min(1).max(2000),
  level: z.enum(["L0", "L1", "L2", "L3", "L4", "L5", "L6"]),
  resolution: z.string().max(2000).optional(),
  outcome: z.string().max(2000).optional(),
});

const parentContactSchema = z.object({
  incidentId: z.string().optional(),
  studentId: z.string().optional(),
  date: z.string().min(1),
  method: z.enum(["PHONE", "MEETING", "WRITTEN_NOTE", "OTHER"]),
  outcome: z.string().max(2000).optional(),
  nextSteps: z.string().max(2000).optional(),
});

export async function createIncident(formData: FormData) {
  const user = await requireAuth();
  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });
  if (!profile?.staffId) return { error: "no_staff_record" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = incidentSchema.safeParse(raw);
  if (!parsed.success) return { error: "validation" };

  const d = parsed.data;

  // Create incident
  const incident = await prisma.behaviorIncident.create({
    data: {
      studentId: d.studentId,
      date: new Date(d.date),
      description: d.description,
      level: d.level as never,
      teacherId: profile.staffId,
      resolution: d.resolution || null,
      outcome: d.outcome || null,
    },
  });

  // Get student's current level
  const student = await prisma.student.findUnique({
    where: { id: d.studentId },
    select: { currentBehaviorLevel: true },
  });

  // Update student behavior level if this incident is higher
  const levelOrder = ["L0", "L1", "L2", "L3", "L4", "L5", "L6"];
  const newIdx = levelOrder.indexOf(d.level);
  const curIdx = levelOrder.indexOf(student?.currentBehaviorLevel ?? "L0");

  if (newIdx > curIdx) {
    await prisma.student.update({
      where: { id: d.studentId },
      data: { currentBehaviorLevel: d.level as never },
    });

    await prisma.behaviorLevelChange.create({
      data: {
        studentId: d.studentId,
        fromLevel: (student?.currentBehaviorLevel ?? "L0") as never,
        toLevel: d.level as never,
        changedById: profile.staffId,
        reason: d.description,
      },
    });
  }

  // Auto-notify admin at L4+
  if (newIdx >= 4) {
    const admins = await prisma.userProfile.findMany({
      where: { role: { in: ["DIRECTOR", "ADMIN"] }, active: true },
      select: { id: true },
    });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          recipientId: admin.id,
          kind: "STUDENT_BEHAVIOR_L4_PLUS",
          title: `Comportement ${d.level} signalé`,
          body: d.description.slice(0, 200),
          payload: { studentId: d.studentId, incidentId: incident.id },
        },
      });
    }
  }

  revalidatePath("/dashboard/behavior");
  return { ok: true };
}

export async function logParentContact(formData: FormData) {
  const user = await requireAuth();
  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });
  if (!profile?.staffId) return { error: "no_staff_record" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = parentContactSchema.safeParse(raw);
  if (!parsed.success) return { error: "validation" };

  const d = parsed.data;

  await prisma.parentContact.create({
    data: {
      incidentId: d.incidentId || null,
      studentId: d.studentId || null,
      date: new Date(d.date),
      method: d.method as never,
      contactedById: profile.staffId,
      outcome: d.outcome || null,
      nextSteps: d.nextSteps || null,
    },
  });

  revalidatePath("/dashboard/behavior");
  return { ok: true };
}
