"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function updateBehaviorLevel(
  studentId: string,
  newLevel: string,
  reason: string,
) {
  const user = await requireAuth();
  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { currentBehaviorLevel: true },
  });

  if (!student) return { error: "student_not_found" };

  const oldLevel = student.currentBehaviorLevel;
  if (oldLevel === newLevel && !reason) return { ok: true };

  // Update student level
  await prisma.student.update({
    where: { id: studentId },
    data: { currentBehaviorLevel: newLevel as never },
  });

  // Log the change
  await prisma.behaviorLevelChange.create({
    data: {
      studentId,
      fromLevel: oldLevel as never,
      toLevel: newLevel as never,
      changedById: profile?.staffId || null,
      reason: reason || null,
    },
  });

  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath("/dashboard/behavior");
  return { ok: true };
}
