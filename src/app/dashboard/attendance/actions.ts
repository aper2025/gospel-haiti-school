"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type MarkEntry = {
  studentId: string;
  code: string;
  notes?: string;
  clientUuid: string;
};

export async function markAttendanceBulk(date: string, entries: MarkEntry[]) {
  const user = await requireAuth();

  // Get the staff record for the current user
  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });

  if (!profile?.staffId) {
    return { error: "no_staff_record" };
  }

  for (const entry of entries) {
    await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: entry.studentId,
          date: new Date(date),
        },
      },
      update: {
        code: entry.code as never,
        notes: entry.notes || null,
        syncedAt: new Date(),
      },
      create: {
        studentId: entry.studentId,
        date: new Date(date),
        code: entry.code as never,
        markedById: profile.staffId,
        notes: entry.notes || null,
        clientUuid: entry.clientUuid,
        syncedAt: new Date(),
      },
    });
  }

  revalidatePath("/dashboard/attendance");
  return { ok: true };
}
