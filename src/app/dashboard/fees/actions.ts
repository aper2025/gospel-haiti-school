"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

const feeScheduleSchema = z.object({
  classId: z.string().min(1),
  amountHtg: z.coerce.number().min(0),
  notes: z.string().max(500).optional(),
});

const paymentSchema = z.object({
  accountId: z.string().min(1),
  date: z.string().min(1),
  amountHtg: z.coerce.number().min(0.01),
  method: z.enum(["CASH", "CHECK", "TRANSFER", "MONEY_ORDER", "OTHER"]),
  notes: z.string().max(500).optional(),
});

export async function upsertFeeSchedule(formData: FormData) {
  const user = await requireRole("DIRECTOR", "ADMIN");

  const raw = Object.fromEntries(formData.entries());
  const parsed = feeScheduleSchema.safeParse(raw);
  if (!parsed.success) return { error: "validation" };

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return { error: "no_active_year" };

  await prisma.feeSchedule.upsert({
    where: {
      yearId_classId: { yearId: activeYear.id, classId: parsed.data.classId },
    },
    update: {
      amountHtg: parsed.data.amountHtg,
      notes: parsed.data.notes || null,
    },
    create: {
      yearId: activeYear.id,
      classId: parsed.data.classId,
      amountHtg: parsed.data.amountHtg,
      notes: parsed.data.notes || null,
    },
  });

  // Create/update fee accounts for all active students in this class
  const students = await prisma.student.findMany({
    where: { currentClassId: parsed.data.classId, enrollmentStatus: "ACTIVE" },
    select: { id: true },
  });

  for (const s of students) {
    await prisma.feeAccount.upsert({
      where: {
        studentId_yearId: { studentId: s.id, yearId: activeYear.id },
      },
      update: { totalOwed: parsed.data.amountHtg },
      create: {
        studentId: s.id,
        yearId: activeYear.id,
        totalOwed: parsed.data.amountHtg,
        totalPaid: 0,
        status: "UNPAID",
      },
    });
  }

  revalidatePath("/dashboard/fees");
  return { ok: true };
}

export async function recordPayment(formData: FormData) {
  const user = await requireRole("DIRECTOR", "ADMIN");

  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });
  if (!profile?.staffId) return { error: "no_staff_record" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) return { error: "validation" };

  const d = parsed.data;

  await prisma.payment.create({
    data: {
      accountId: d.accountId,
      date: new Date(d.date),
      amountHtg: d.amountHtg,
      method: d.method as never,
      receivedById: profile.staffId,
      notes: d.notes || null,
    },
  });

  // Update account totals
  const payments = await prisma.payment.findMany({
    where: { accountId: d.accountId },
    select: { amountHtg: true },
  });
  const totalPaid = payments.reduce(
    (sum, p) => sum + Number(p.amountHtg),
    0,
  );

  const account = await prisma.feeAccount.findUnique({
    where: { id: d.accountId },
    select: { totalOwed: true },
  });

  const owed = Number(account?.totalOwed ?? 0);
  let status: string;
  if (totalPaid >= owed) status = "PAID_IN_FULL";
  else if (totalPaid > 0) status = "PARTIAL";
  else status = "UNPAID";

  await prisma.feeAccount.update({
    where: { id: d.accountId },
    data: {
      totalPaid,
      status: status as never,
      lastPayment: new Date(d.date),
    },
  });

  revalidatePath("/dashboard/fees");
  return { ok: true };
}
