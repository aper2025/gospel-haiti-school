import { z } from "zod";

export const evaluationSchema = z.object({
  studentId: z.string().min(1),
  subject: z.string().min(1),
  type: z.enum(["PETITE_EVALUATION", "GRANDE_EVALUATION", "DICTEE", "EXAMEN", "AUTRE"]),
  scorePct: z.coerce.number().min(0).max(100),
  date: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export type EvaluationFormData = z.infer<typeof evaluationSchema>;

export function computeLetterGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function computeGroup(score: number): string {
  if (score >= 80) return "G1";
  if (score >= 70) return "G2";
  if (score >= 40) return "G3";
  return "G4";
}

/** Monday of the week containing the given date */
export function weekStartOf(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split("T")[0];
}
