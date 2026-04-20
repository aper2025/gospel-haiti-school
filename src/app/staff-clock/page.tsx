import { prisma } from "@/lib/prisma";
import { haitiDateOnly, formatDateFR } from "@/lib/timezone";
import { StaffClockClient } from "./client";

export const dynamic = "force-dynamic";

export default async function StaffClockPage() {
  const staff = await prisma.staff.findMany({
    where: { active: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });

  const today = new Date();
  const dateOnly = haitiDateOnly();

  const todayEntries = await prisma.timeClockEntry.findMany({
    where: { date: dateOnly },
    select: { staffId: true, signInAt: true, signOutAt: true },
  });

  const statusMap: Record<string, { signedIn: boolean; signedOut: boolean }> = {};
  for (const e of todayEntries) {
    statusMap[e.staffId] = {
      signedIn: !!e.signInAt,
      signedOut: !!e.signOutAt,
    };
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30 mb-4">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Pointage du personnel</h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatDateFR(today, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <StaffClockClient staff={staff} statusMap={statusMap} />
      </div>
    </main>
  );
}
