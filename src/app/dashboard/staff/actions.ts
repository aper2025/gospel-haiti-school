"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const staffSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  gender: z.enum(["M", "F"]).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  addressVillage: z.string().max(200).optional(),
  addressNeighborhood: z.string().max(200).optional(),
  addressCommune: z.string().max(200).optional(),
  addressDepartment: z.string().max(200).optional(),
  role: z.enum(["DIRECTOR", "ADMIN", "HOMEROOM_TEACHER", "SUBJECT_TEACHER", "ASSISTANT", "SUPPORT"]),
  contractType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "VOLUNTEER"]).optional(),
  startDate: z.string().optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
  staffPin: z.string().max(4).optional(),
});

const observationSchema = z.object({
  staffId: z.string().min(1),
  date: z.string().min(1),
  score: z.coerce.number().min(0).max(100).optional(),
  strengths: z.string().max(2000).optional(),
  improvements: z.string().max(2000).optional(),
  actionPlan: z.string().max(2000).optional(),
  followUpDate: z.string().optional(),
  outcome: z.string().max(2000).optional(),
});

const leaveSchema = z.object({
  staffId: z.string().min(1),
  type: z.enum(["SICK", "PERSONAL", "FAMILY_EMERGENCY", "PROFESSIONAL_DEVELOPMENT"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().max(1000).optional(),
});

export async function createStaff(formData: FormData) {
  await requireRole("DIRECTOR", "ADMIN");

  const raw = Object.fromEntries(formData.entries());
  const parsed = staffSchema.safeParse(raw);
  if (!parsed.success) return { error: "validation" };

  const d = parsed.data;
  const staff = await prisma.staff.create({
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      displayName: `${d.firstName} ${d.lastName}`,
      gender: (d.gender as never) || null,
      dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
      phone: d.phone || null,
      email: d.email || null,
      addressVillage: d.addressVillage || null,
      addressNeighborhood: d.addressNeighborhood || null,
      addressCommune: d.addressCommune || null,
      addressDepartment: d.addressDepartment || null,
      role: d.role as never,
      contractType: (d.contractType as never) || null,
      startDate: d.startDate ? new Date(d.startDate) : null,
      emergencyContactName: d.emergencyContactName || null,
      emergencyContactPhone: d.emergencyContactPhone || null,
      staffPin: d.staffPin || null,
    },
  });

  revalidatePath("/dashboard/staff");
  redirect(`/dashboard/staff/${staff.id}`);
}

export async function updateStaff(id: string, formData: FormData) {
  await requireRole("DIRECTOR", "ADMIN");

  const raw = Object.fromEntries(formData.entries());
  const parsed = staffSchema.safeParse(raw);
  if (!parsed.success) return { error: "validation" };

  const d = parsed.data;
  await prisma.staff.update({
    where: { id },
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      displayName: `${d.firstName} ${d.lastName}`,
      gender: (d.gender as never) || null,
      dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
      phone: d.phone || null,
      email: d.email || null,
      addressVillage: d.addressVillage || null,
      addressNeighborhood: d.addressNeighborhood || null,
      addressCommune: d.addressCommune || null,
      addressDepartment: d.addressDepartment || null,
      role: d.role as never,
      contractType: (d.contractType as never) || null,
      startDate: d.startDate ? new Date(d.startDate) : null,
      emergencyContactName: d.emergencyContactName || null,
      emergencyContactPhone: d.emergencyContactPhone || null,
      staffPin: d.staffPin || null,
    },
  });

  revalidatePath("/dashboard/staff");
  redirect(`/dashboard/staff/${id}`);
}

export async function updatePerformanceStatus(id: string, status: string) {
  await requireRole("DIRECTOR", "ADMIN");

  await prisma.staff.update({
    where: { id },
    data: { performanceStatus: status as never },
  });

  revalidatePath("/dashboard/staff");
  return { ok: true };
}

export async function createObservation(formData: FormData) {
  const user = await requireRole("DIRECTOR", "ADMIN");
  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });
  if (!profile?.staffId) return { error: "no_staff_record" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = observationSchema.safeParse({
    ...raw,
    score: raw.score || undefined,
  });
  if (!parsed.success) return { error: "validation" };

  const d = parsed.data;
  await prisma.observation.create({
    data: {
      staffId: d.staffId,
      observerId: profile.staffId,
      date: new Date(d.date),
      score: d.score ?? null,
      strengths: d.strengths || null,
      improvements: d.improvements || null,
      actionPlan: d.actionPlan || null,
      followUpDate: d.followUpDate ? new Date(d.followUpDate) : null,
      outcome: d.outcome || null,
    },
  });

  revalidatePath("/dashboard/staff");
  return { ok: true };
}

export async function createLeaveRequest(formData: FormData) {
  const user = await requireRole("DIRECTOR", "ADMIN", "HOMEROOM_TEACHER", "SUBJECT_TEACHER", "ASSISTANT", "SUPPORT");
  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });
  if (!profile?.staffId) return { error: "no_staff_record" };

  const raw = Object.fromEntries(formData.entries());
  // If admin creating for someone else
  const staffId = raw.staffId as string || profile.staffId;

  const parsed = leaveSchema.safeParse({ ...raw, staffId });
  if (!parsed.success) return { error: "validation" };

  const d = parsed.data;
  await prisma.leaveRequest.create({
    data: {
      staffId: d.staffId,
      type: d.type as never,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      reason: d.reason || null,
    },
  });

  revalidatePath("/dashboard/staff");
  return { ok: true };
}

export async function reviewLeave(leaveId: string, status: "APPROVED" | "DENIED", notes?: string) {
  const user = await requireRole("DIRECTOR", "ADMIN");
  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });

  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: status as never,
      reviewedById: profile?.staffId,
      reviewedAt: new Date(),
      reviewerNotes: notes || null,
    },
  });

  revalidatePath("/dashboard/staff");
  return { ok: true };
}
