"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const timeSlotSchema = z.object({
  label: z.string().min(1).max(100),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isBreak: z.boolean().default(false),
  orderIdx: z.coerce.number().int().min(0),
});

const timetableEntrySchema = z.object({
  classId: z.string().min(1),
  subject: z.string().min(1),
  teacherId: z.string().min(1),
  timeSlotId: z.string().min(1),
});

const calendarEventSchema = z.object({
  type: z.enum(["TRIMESTRE_START", "TRIMESTRE_END", "HOLIDAY", "EXAM_WEEK", "NO_SCHOOL", "STAFF_MEETING", "SPECIAL_EVENT"]),
  title: z.string().min(1).max(200),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  description: z.string().max(1000).optional(),
});

export async function createTimeSlot(formData: FormData) {
  await requireRole("DIRECTOR", "ADMIN");

  const raw = Object.fromEntries(formData.entries());
  const parsed = timeSlotSchema.safeParse({
    ...raw,
    isBreak: raw.isBreak === "on" || raw.isBreak === "true",
  });
  if (!parsed.success) return { error: "validation" };

  await prisma.timeSlot.create({ data: parsed.data as never });

  revalidatePath("/dashboard/schedules");
  return { ok: true };
}

export async function deleteTimeSlot(id: string) {
  await requireRole("DIRECTOR", "ADMIN");
  await prisma.timeSlot.delete({ where: { id } });
  revalidatePath("/dashboard/schedules");
  return { ok: true };
}

export async function createTimetableEntry(formData: FormData) {
  await requireRole("DIRECTOR", "ADMIN");

  const raw = Object.fromEntries(formData.entries());
  const parsed = timetableEntrySchema.safeParse(raw);
  if (!parsed.success) return { error: "validation" };

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return { error: "no_active_year" };

  const d = parsed.data;

  // Check for teacher conflict
  const conflict = await prisma.timetableEntry.findFirst({
    where: {
      teacherId: d.teacherId,
      timeSlotId: d.timeSlotId,
      yearId: activeYear.id,
      classId: { not: d.classId },
    },
    include: { class: { select: { label: true } } },
  });

  if (conflict) {
    // Notify admins about conflict
    const admins = await prisma.userProfile.findMany({
      where: { role: { in: ["DIRECTOR", "ADMIN"] }, active: true },
      select: { id: true },
    });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          recipientId: admin.id,
          kind: "TIMETABLE_CONFLICT",
          title: "Conflit d'horaire détecté",
          body: `Enseignant déjà assigné à ${conflict.class.label} pour ce créneau.`,
          payload: { teacherId: d.teacherId, timeSlotId: d.timeSlotId },
        },
      });
    }
    return { error: "conflict", conflictClass: conflict.class.label };
  }

  await prisma.timetableEntry.upsert({
    where: {
      classId_timeSlotId_yearId: {
        classId: d.classId,
        timeSlotId: d.timeSlotId,
        yearId: activeYear.id,
      },
    },
    update: {
      subject: d.subject as never,
      teacherId: d.teacherId,
    },
    create: {
      classId: d.classId,
      subject: d.subject as never,
      teacherId: d.teacherId,
      timeSlotId: d.timeSlotId,
      yearId: activeYear.id,
    },
  });

  revalidatePath("/dashboard/schedules");
  return { ok: true };
}

export async function deleteTimetableEntry(id: string) {
  await requireRole("DIRECTOR", "ADMIN");
  await prisma.timetableEntry.delete({ where: { id } });
  revalidatePath("/dashboard/schedules");
  return { ok: true };
}

export async function createCalendarEvent(formData: FormData) {
  await requireRole("DIRECTOR", "ADMIN");

  const raw = Object.fromEntries(formData.entries());
  const parsed = calendarEventSchema.safeParse(raw);
  if (!parsed.success) return { error: "validation" };

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return { error: "no_active_year" };

  const d = parsed.data;
  await prisma.schoolCalendarEvent.create({
    data: {
      yearId: activeYear.id,
      type: d.type as never,
      title: d.title,
      startDate: new Date(d.startDate),
      endDate: d.endDate ? new Date(d.endDate) : null,
      description: d.description || null,
    },
  });

  revalidatePath("/dashboard/schedules");
  return { ok: true };
}

export async function deleteCalendarEvent(id: string) {
  await requireRole("DIRECTOR", "ADMIN");
  await prisma.schoolCalendarEvent.delete({ where: { id } });
  revalidatePath("/dashboard/schedules");
  return { ok: true };
}
