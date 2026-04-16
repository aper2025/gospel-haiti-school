import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { EditStaffClient } from "./client";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("DIRECTOR", "ADMIN");
  const { id } = await params;

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Modifier — {staff.firstName} {staff.lastName}
      </h1>
      <div className="mt-6">
        <EditStaffClient staff={staff} />
      </div>
    </div>
  );
}
