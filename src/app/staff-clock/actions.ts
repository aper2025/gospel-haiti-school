"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { haitiDateOnly } from "@/lib/timezone";

export async function staffClockAction(staffId: string, pin: string, action: "in" | "out") {
  // Verify PIN
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, staffPin: true, firstName: true, lastName: true },
  });

  if (!staff) return { error: "staff_not_found" };
  if (!staff.staffPin || staff.staffPin !== pin) return { error: "invalid_pin" };

  const now = new Date();
  const dateOnly = haitiDateOnly();

  if (action === "in") {
    await prisma.timeClockEntry.upsert({
      where: { staffId_date: { staffId, date: dateOnly } },
      update: {}, // already signed in
      create: {
        staffId,
        date: dateOnly,
        signInAt: now,
      },
    });
  } else {
    const entry = await prisma.timeClockEntry.findUnique({
      where: { staffId_date: { staffId, date: dateOnly } },
    });

    if (!entry || !entry.signInAt) return { error: "not_signed_in" };
    if (entry.signOutAt) return { error: "already_signed_out" };

    const hours = (now.getTime() - entry.signInAt.getTime()) / 3600000;

    await prisma.timeClockEntry.update({
      where: { id: entry.id },
      data: {
        signOutAt: now,
        hoursWorked: Math.round(hours * 100) / 100,
      },
    });
  }

  revalidatePath("/staff-clock");
  revalidatePath("/dashboard/time-clock");
  return { ok: true, name: `${staff.firstName} ${staff.lastName}` };
}
