import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { TimetableGrid } from "./timetable-grid";
import { TimeSlotForm } from "./time-slot-form";
import { TimetableEntryForm } from "./timetable-entry-form";
import { CalendarEventForm } from "./calendar-event-form";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
};

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; class?: string }>;
}) {
  const user = await requireAuth();
  const t = await getTranslations();
  const params = await searchParams;
  const tab = params.tab || "timetable";
  const isAdmin = hasRole(user, "DIRECTOR", "ADMIN");

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });

  const classes = await prisma.class.findMany({
    where: { excluded: false },
    orderBy: { orderIdx: "asc" },
    select: { id: true, label: true },
  });

  const selectedClassId = params.class || classes[0]?.id || null;

  const timeSlots = await prisma.timeSlot.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { orderIdx: "asc" }],
  });

  let entries: {
    id: string;
    classId: string;
    subject: string;
    teacherId: string;
    timeSlotId: string;
    teacher: { firstName: string; lastName: string };
  }[] = [];

  if (selectedClassId && activeYear) {
    entries = await prisma.timetableEntry.findMany({
      where: { classId: selectedClassId, yearId: activeYear.id },
      include: { teacher: { select: { firstName: true, lastName: true } } },
    });
  }

  const staff = await prisma.staff.findMany({
    where: { active: true, role: { in: ["HOMEROOM_TEACHER", "SUBJECT_TEACHER", "DIRECTOR", "ADMIN"] } },
    orderBy: [{ lastName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });

  const calendarEvents = activeYear
    ? await prisma.schoolCalendarEvent.findMany({
        where: { yearId: activeYear.id },
        orderBy: { startDate: "asc" },
      })
    : [];

  const subjects = [
    "LECTURE", "MATHEMATIQUES", "DICTEE_ORTHOGRAPHE", "CONJUGAISON_GRAMMAIRE",
    "SCIENCES", "BIOLOGIE", "PHYSIQUE", "HISTOIRE", "GEOGRAPHIE",
    "SCIENCES_SOCIALES", "ANGLAIS", "ESPAGNOL", "CREOLE", "MUSIQUE",
  ];
  const subjectLabels: Record<string, string> = {};
  for (const s of subjects) subjectLabels[s] = t(`gradebook.subjects.${s}`);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Horaires et calendrier</h1>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 border-b border-slate-200">
        {[
          { key: "timetable", label: "Emploi du temps" },
          { key: "slots", label: "Créneaux" },
          { key: "calendar", label: "Calendrier" },
        ].map((tb) => (
          <Link key={tb.key} href={`/dashboard/schedules?tab=${tb.key}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === tb.key ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            {tb.label}
          </Link>
        ))}
      </div>

      {tab === "timetable" && (
        <div className="mt-4">
          <TimetableGrid
            classes={classes}
            selectedClassId={selectedClassId}
            timeSlots={timeSlots.map((ts) => ({
              ...ts,
              dayLabel: DAY_LABELS[ts.dayOfWeek] ?? ts.dayOfWeek,
            }))}
            entries={entries}
            subjectLabels={subjectLabels}
          />

          {isAdmin && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Ajouter une entrée</h2>
              <TimetableEntryForm
                classes={classes}
                timeSlots={timeSlots.map((ts) => ({
                  id: ts.id,
                  label: `${DAY_LABELS[ts.dayOfWeek]} ${ts.startTime}–${ts.endTime} (${ts.label})`,
                }))}
                staff={staff}
                subjects={subjects}
                subjectLabels={subjectLabels}
                translations={{ save: t("common.save"), loading: t("common.loading") }}
              />
            </div>
          )}
        </div>
      )}

      {tab === "slots" && isAdmin && (
        <div className="mt-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white mb-4">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Jour</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Créneau</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Horaire</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Pause</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Ordre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timeSlots.map((ts) => (
                  <tr key={ts.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-sm text-slate-700">{DAY_LABELS[ts.dayOfWeek]}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900">{ts.label}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{ts.startTime}–{ts.endTime}</td>
                    <td className="px-4 py-2.5 text-center text-sm">{ts.isBreak ? "Oui" : "—"}</td>
                    <td className="px-4 py-2.5 text-center text-sm text-slate-500">{ts.orderIdx}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Ajouter un créneau</h2>
          <TimeSlotForm translations={{ save: t("common.save"), loading: t("common.loading") }} />
        </div>
      )}

      {tab === "calendar" && (
        <div className="mt-4">
          <div className="space-y-2 mb-6">
            {calendarEvents.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">{t("common.noData")}</p>
            ) : (
              calendarEvents.map((ev) => (
                <div key={ev.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium mr-2 ${
                      ev.type === "HOLIDAY" || ev.type === "NO_SCHOOL"
                        ? "bg-red-50 text-red-700"
                        : ev.type === "EXAM_WEEK"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                    }`}>
                      {ev.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-medium text-slate-900">{ev.title}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {ev.startDate.toLocaleDateString("fr-FR", { timeZone: "UTC" })}
                      {ev.endDate && ` — ${ev.endDate.toLocaleDateString("fr-FR", { timeZone: "UTC" })}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          {isAdmin && (
            <>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Ajouter un événement</h2>
              <CalendarEventForm translations={{ save: t("common.save"), loading: t("common.loading") }} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
