"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function verifyPinAndGetStaff(pin: string) {
  if (!pin || pin.length !== 4) return { error: "invalid_pin" };

  const staff = await prisma.staff.findUnique({
    where: { staffPin: pin },
    select: { id: true, firstName: true, lastName: true, role: true },
  });

  if (!staff) return { error: "invalid_pin" };
  return { ok: true, staff };
}

export async function saveAttendanceBulk(
  staffId: string,
  classId: string,
  date: string,
  marks: Record<string, string>, // studentId → code
) {
  const dateOnly = new Date(date);

  for (const [studentId, code] of Object.entries(marks)) {
    if (!code) continue;

    await prisma.attendance.upsert({
      where: {
        studentId_date: { studentId, date: dateOnly },
      },
      update: {
        code: code as never,
        syncedAt: new Date(),
      },
      create: {
        studentId,
        date: dateOnly,
        code: code as never,
        markedById: staffId,
        clientUuid: `att-${studentId}-${date}-${Date.now()}`,
        syncedAt: new Date(),
      },
    });
  }

  revalidatePath("/take-attendance");
  revalidatePath("/dashboard/attendance");
  return { ok: true, count: Object.values(marks).filter(Boolean).length };
}
