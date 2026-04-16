"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function signIn() {
  const user = await requireAuth();
  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });
  if (!profile?.staffId) return { error: "no_staff_record" };

  const today = new Date();
  const dateOnly = new Date(today.toISOString().split("T")[0]);

  await prisma.timeClockEntry.upsert({
    where: { staffId_date: { staffId: profile.staffId, date: dateOnly } },
    update: {}, // already signed in today
    create: {
      staffId: profile.staffId,
      date: dateOnly,
      signInAt: today,
    },
  });

  revalidatePath("/dashboard/time-clock");
  return { ok: true };
}

export async function signOut() {
  const user = await requireAuth();
  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });
  if (!profile?.staffId) return { error: "no_staff_record" };

  const today = new Date();
  const dateOnly = new Date(today.toISOString().split("T")[0]);

  const entry = await prisma.timeClockEntry.findUnique({
    where: { staffId_date: { staffId: profile.staffId, date: dateOnly } },
  });

  if (!entry || !entry.signInAt) return { error: "not_signed_in" };

  const hours = (today.getTime() - entry.signInAt.getTime()) / 3600000;

  await prisma.timeClockEntry.update({
    where: { id: entry.id },
    data: {
      signOutAt: today,
      hoursWorked: Math.round(hours * 100) / 100,
    },
  });

  revalidatePath("/dashboard/time-clock");
  return { ok: true };
}

export async function adminRecordEntry(formData: FormData) {
  await requireAuth();

  const staffId = formData.get("staffId") as string;
  const date = formData.get("date") as string;
  const signInTime = formData.get("signInAt") as string;
  const signOutTime = formData.get("signOutAt") as string;
  const notes = formData.get("notes") as string;

  if (!staffId || !date) return { error: "missing_fields" };

  const dateOnly = new Date(date);
  const signInAt = signInTime ? new Date(`${date}T${signInTime}`) : null;
  const signOutAt = signOutTime ? new Date(`${date}T${signOutTime}`) : null;

  let hoursWorked = null;
  if (signInAt && signOutAt) {
    hoursWorked = Math.round(((signOutAt.getTime() - signInAt.getTime()) / 3600000) * 100) / 100;
  }

  await prisma.timeClockEntry.upsert({
    where: { staffId_date: { staffId, date: dateOnly } },
    update: { signInAt, signOutAt, hoursWorked, notes: notes || null },
    create: { staffId, date: dateOnly, signInAt, signOutAt, hoursWorked, notes: notes || null },
  });

  revalidatePath("/dashboard/time-clock");
  return { ok: true };
}
