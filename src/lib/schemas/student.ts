import { z } from "zod";

export const studentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  gender: z.enum(["M", "F"]).optional(),
  dateOfBirth: z.string().optional(), // "YYYY-MM-DD"
  addressVillage: z.string().max(200).optional(),
  addressNeighborhood: z.string().max(200).optional(),
  addressCommune: z.string().max(200).optional(),
  addressDepartment: z.string().max(200).optional(),
  currentClassId: z.string().optional(),
  enrollmentDate: z.string().optional(),
  enrollmentStatus: z.enum(["ACTIVE", "WITHDRAWN", "GRADUATED"]).default("ACTIVE"),
  motherFirstName: z.string().max(100).optional(),
  motherLastName: z.string().max(100).optional(),
  motherAlive: z.enum(["YES", "NO"]).optional(),
  motherPhone: z.string().max(30).optional(),
  fatherFirstName: z.string().max(100).optional(),
  fatherLastName: z.string().max(100).optional(),
  fatherAlive: z.enum(["YES", "NO"]).optional(),
  fatherPhone: z.string().max(30).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
  medicalNotes: z.string().max(2000).optional(),
  birthCertOnFile: z.boolean().default(false),
  generalNotes: z.string().max(2000).optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;
