import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { NewStudentClient } from "./client";

export default async function NewStudentPage() {
  await requireRole("DIRECTOR", "ADMIN");

  const classes = await prisma.class.findMany({
    where: { excluded: false },
    orderBy: { orderIdx: "asc" },
    select: { id: true, label: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Nouvel élève
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Remplissez les informations ci-dessous pour inscrire un nouvel élève.
      </p>
      <div className="mt-6">
        <NewStudentClient classes={classes} />
      </div>
    </div>
  );
}
