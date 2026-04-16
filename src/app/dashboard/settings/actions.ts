"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const schoolYearSchema = z.object({
  label: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isActive: z.boolean().default(false),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["DIRECTOR", "ADMIN", "HOMEROOM_TEACHER", "SUBJECT_TEACHER", "ASSISTANT", "SUPPORT"]),
  staffId: z.string().optional(),
});

export async function createSchoolYear(formData: FormData) {
  await requireRole("DIRECTOR", "ADMIN");

  const raw = Object.fromEntries(formData.entries());
  const parsed = schoolYearSchema.safeParse({
    ...raw,
    isActive: raw.isActive === "on",
  });
  if (!parsed.success) return { error: "validation" };

  const d = parsed.data;

  // If setting as active, deactivate others
  if (d.isActive) {
    await prisma.schoolYear.updateMany({ data: { isActive: false } });
  }

  await prisma.schoolYear.create({
    data: {
      label: d.label,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      isActive: d.isActive,
    },
  });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function createUserAccount(formData: FormData) {
  await requireRole("DIRECTOR", "ADMIN");

  const raw = Object.fromEntries(formData.entries());
  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) return { error: "validation" };

  const d = parsed.data;

  // Create in Supabase Auth
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: d.email,
    password: d.password,
    email_confirm: true,
  });

  if (error) return { error: error.message };

  // Create UserProfile
  await prisma.userProfile.create({
    data: {
      authUid: data.user.id,
      email: d.email,
      role: d.role as never,
      staffId: d.staffId || null,
      active: true,
    },
  });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}
