"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { studentSchema } from "@/lib/schemas/student";

function generateSchoolEmail(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0).toLowerCase();
  const last = lastName.trim().toLowerCase().replace(/\s+/g, "");
  return `${first}${last}@gospelhaiti.org`;
}

export async function createStudent(formData: FormData) {
  await requireRole("DIRECTOR", "ADMIN");

  const raw = Object.fromEntries(formData.entries());
  // Convert checkbox
  raw.birthCertOnFile = raw.birthCertOnFile === "on" ? "true" : "false";

  const parsed = studentSchema.safeParse({
    ...raw,
    birthCertOnFile: raw.birthCertOnFile === "true",
  });

  if (!parsed.success) {
    return { error: "validation", details: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const schoolEmail = generateSchoolEmail(data.firstName, data.lastName);

  // Check for duplicate email
  const existing = await prisma.student.findUnique({
    where: { schoolEmail },
  });
  const email = existing ? `${schoolEmail.split("@")[0]}${Date.now().toString(36)}@gospelhaiti.org` : schoolEmail;

  const student = await prisma.student.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      schoolEmail: email,
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      addressVillage: data.addressVillage || null,
      addressNeighborhood: data.addressNeighborhood || null,
      addressCommune: data.addressCommune || null,
      addressDepartment: data.addressDepartment || null,
      currentClassId: data.currentClassId || null,
      enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate) : null,
      enrollmentStatus: data.enrollmentStatus,
      motherFirstName: data.motherFirstName || null,
      motherLastName: data.motherLastName || null,
      motherAlive: data.motherAlive || null,
      motherPhone: data.motherPhone || null,
      fatherFirstName: data.fatherFirstName || null,
      fatherLastName: data.fatherLastName || null,
      fatherAlive: data.fatherAlive || null,
      fatherPhone: data.fatherPhone || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
      medicalNotes: data.medicalNotes || null,
      birthCertOnFile: data.birthCertOnFile,
      generalNotes: data.generalNotes || null,
    },
  });

  // Create enrollment for active school year
  if (data.currentClassId) {
    const activeYear = await prisma.schoolYear.findFirst({
      where: { isActive: true },
    });
    if (activeYear) {
      await prisma.studentEnrollment.create({
        data: {
          studentId: student.id,
          yearId: activeYear.id,
          classId: data.currentClassId,
        },
      });
    }
  }

  revalidatePath("/dashboard/students");
  redirect(`/dashboard/students/${student.id}`);
}

export async function updateStudent(id: string, formData: FormData) {
  await requireRole("DIRECTOR", "ADMIN");

  const raw = Object.fromEntries(formData.entries());

  const parsed = studentSchema.safeParse({
    ...raw,
    birthCertOnFile: raw.birthCertOnFile === "on" || raw.birthCertOnFile === "true",
  });

  if (!parsed.success) {
    return { error: "validation", details: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  await prisma.student.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      addressVillage: data.addressVillage || null,
      addressNeighborhood: data.addressNeighborhood || null,
      addressCommune: data.addressCommune || null,
      addressDepartment: data.addressDepartment || null,
      currentClassId: data.currentClassId || null,
      enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate) : null,
      enrollmentStatus: data.enrollmentStatus,
      motherFirstName: data.motherFirstName || null,
      motherLastName: data.motherLastName || null,
      motherAlive: data.motherAlive || null,
      motherPhone: data.motherPhone || null,
      fatherFirstName: data.fatherFirstName || null,
      fatherLastName: data.fatherLastName || null,
      fatherAlive: data.fatherAlive || null,
      fatherPhone: data.fatherPhone || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
      medicalNotes: data.medicalNotes || null,
      birthCertOnFile: data.birthCertOnFile,
      generalNotes: data.generalNotes || null,
    },
  });

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${id}`);
  redirect(`/dashboard/students/${id}`);
}

export async function deleteStudent(id: string) {
  await requireRole("DIRECTOR");

  await prisma.student.delete({ where: { id } });

  revalidatePath("/dashboard/students");
  redirect("/dashboard/students");
}
