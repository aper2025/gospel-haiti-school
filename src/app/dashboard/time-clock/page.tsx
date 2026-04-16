import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { TimeClockActions } from "./time-clock-actions";
import { AdminEntryForm } from "./admin-entry-form";

export default async function TimeClockPage() {
  const user = await requireAuth();
  const t = await getTranslations();
  const isAdmin = hasRole(user, "DIRECTOR", "ADMIN");

  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.authUid },
    select: { staffId: true },
  });

  const today = new Date();
  const dateOnly = new Date(today.toISOString().split("T")[0]);

  // Current user's entry for today
  let myEntry = null;
  if (profile?.staffId) {
    myEntry = await prisma.timeClockEntry.findUnique({
      where: { staffId_date: { staffId: profile.staffId, date: dateOnly } },
    });
  }

  // All staff entries for today (admin view)
  const allStaff = await prisma.staff.findMany({
    where: { active: true },
    orderBy: [{ lastName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });

  const todayEntries = await prisma.timeClockEntry.findMany({
    where: { date: dateOnly },
    include: { staff: { select: { firstName: true, lastName: true } } },
  });

  const entryMap = new Map(todayEntries.map((e) => [e.staffId, e]));

  // Stats
  const signedIn = todayEntries.filter((e) => e.signInAt).length;
  const signedOut = todayEntries.filter((e) => e.signOutAt).length;
  const missing = allStaff.length - signedIn;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{t("nav.timeClock")}</h1>

      {/* Self sign-in/out */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Mon pointage</h2>
        {!profile?.staffId ? (
          <p className="text-sm text-slate-400">Aucun profil personnel associé.</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600">
              {myEntry?.signInAt ? (
                <>
                  {t("timeClock.signIn")}: {myEntry.signInAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  {myEntry.signOutAt && (
                    <> &middot; {t("timeClock.signOut")}: {myEntry.signOutAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      &middot; {myEntry.hoursWorked?.toString()}h
                    </>
                  )}
                </>
              ) : (
                <span className="text-amber-600">{t("timeClock.notSignedIn")}</span>
              )}
            </div>
            <TimeClockActions
              hasSignedIn={!!myEntry?.signInAt}
              hasSignedOut={!!myEntry?.signOutAt}
              translations={{
                signIn: t("timeClock.signIn"),
                signOut: t("timeClock.signOut"),
                loading: t("common.loading"),
              }}
            />
          </div>
        )}
      </div>

      {/* Dashboard stats */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t("timeClock.onSite")} value={String(signedIn)} />
        <StatCard label={t("timeClock.signOut")} value={String(signedOut)} />
        <StatCard label={t("timeClock.notSignedIn")} value={String(missing)} alert={missing > 0} />
      </div>

      {/* Today's entries table */}
      {isAdmin && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Aujourd'hui — {dateOnly.toLocaleDateString("fr-FR")}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Nom</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">{t("timeClock.signIn")}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">{t("timeClock.signOut")}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">{t("timeClock.hoursWorked")}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allStaff.map((s) => {
                  const entry = entryMap.get(s.id);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-900">
                        {s.lastName}, {s.firstName}
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm text-slate-600">
                        {entry?.signInAt?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm text-slate-600">
                        {entry?.signOutAt?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm text-slate-600">
                        {entry?.hoursWorked?.toString() ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <ClockStatus entry={entry} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Admin manual entry */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Saisie manuelle</h2>
            <AdminEntryForm
              staff={allStaff}
              translations={{ save: t("common.save"), loading: t("common.loading") }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${alert ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${alert ? "text-amber-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function ClockStatus({ entry }: { entry?: { signInAt: Date | null; signOutAt: Date | null } | null }) {
  if (!entry || !entry.signInAt) {
    return <span className="inline-flex rounded-full bg-red-50 text-red-700 px-2.5 py-0.5 text-xs font-medium">Absent</span>;
  }
  if (entry.signInAt && !entry.signOutAt) {
    return <span className="inline-flex rounded-full bg-green-50 text-green-700 px-2.5 py-0.5 text-xs font-medium">Sur place</span>;
  }
  return <span className="inline-flex rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-xs font-medium">Parti</span>;
}
