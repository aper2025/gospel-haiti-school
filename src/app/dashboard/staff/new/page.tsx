import { requireRole } from "@/lib/auth";
import { NewStaffClient } from "./client";

export default async function NewStaffPage() {
  await requireRole("DIRECTOR", "ADMIN");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">Nouveau membre du personnel</h1>
      <div className="mt-6">
        <NewStaffClient />
      </div>
    </div>
  );
}
