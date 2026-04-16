import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { EditStudentClient } from "./client";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("DIRECTOR", "ADMIN");
  const { id } = await params;

  const [student, classes] = await Promise.all([
    prisma.student.findUnique({
      where: { id },
      include: { currentClass: true },
    }),
    prisma.class.findMany({
      where: { excluded: false },
      orderBy: { orderIdx: "asc" },
      select: { id: true, label: true },
    }),
  ]);

  if (!student) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Modifier — {student.firstName} {student.lastName}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {student.currentClass?.label ?? "Aucune classe"}
      </p>
      <div className="mt-6">
        <EditStudentClient student={student} classes={classes} />
      </div>
    </div>
  );
}
