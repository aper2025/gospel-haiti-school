"use client";

import { useRouter, useSearchParams } from "next/navigation";

type TimeSlot = {
  id: string;
  label: string;
  dayOfWeek: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  orderIdx: number;
};

type Entry = {
  id: string;
  classId: string;
  subject: string;
  teacherId: string;
  timeSlotId: string;
  teacher: { firstName: string; lastName: string };
};

type Props = {
  classes: { id: string; label: string }[];
  selectedClassId: string | null;
  timeSlots: TimeSlot[];
  entries: Entry[];
  subjectLabels: Record<string, string>;
};

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const DAY_SHORT: Record<string, string> = {
  MONDAY: "Lun", TUESDAY: "Mar", WEDNESDAY: "Mer", THURSDAY: "Jeu", FRIDAY: "Ven",
};

export function TimetableGrid({ classes, selectedClassId, timeSlots, entries, subjectLabels }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const entryMap = new Map(entries.map((e) => [e.timeSlotId, e]));

  // Group slots by day
  const slotsByDay: Record<string, TimeSlot[]> = {};
  for (const d of DAYS) slotsByDay[d] = [];
  for (const ts of timeSlots) {
    slotsByDay[ts.dayOfWeek]?.push(ts);
  }

  // Get unique ordered time rows (by orderIdx)
  const uniqueOrders = [...new Set(timeSlots.map((ts) => ts.orderIdx))].sort((a, b) => a - b);

  function handleClassChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("class", value);
    params.set("tab", "timetable");
    router.push(`/dashboard/schedules?${params.toString()}`);
  }

  return (
    <div>
      <div className="mb-4">
        <select
          value={selectedClassId ?? ""}
          onChange={(e) => handleClassChange(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-slate-500 w-20">Heure</th>
              {DAYS.map((d) => (
                <th key={d} className="px-3 py-3 text-center text-xs font-medium uppercase text-slate-500">
                  {DAY_SHORT[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {uniqueOrders.map((orderIdx) => {
              // Get a representative slot for this row (for time display)
              const rep = timeSlots.find((ts) => ts.orderIdx === orderIdx);
              if (!rep) return null;

              return (
                <tr key={orderIdx} className={rep.isBreak ? "bg-slate-50" : "hover:bg-slate-50"}>
                  <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                    {rep.startTime}
                    <br />
                    {rep.endTime}
                  </td>
                  {DAYS.map((day) => {
                    const slot = slotsByDay[day]?.find((s) => s.orderIdx === orderIdx);
                    if (!slot) return <td key={day} className="px-3 py-2" />;

                    if (slot.isBreak) {
                      return (
                        <td key={day} className="px-3 py-2 text-center text-xs text-slate-400 italic">
                          {slot.label}
                        </td>
                      );
                    }

                    const entry = entryMap.get(slot.id);
                    return (
                      <td key={day} className="px-3 py-2 text-center">
                        {entry ? (
                          <div>
                            <p className="text-xs font-medium text-slate-900">
                              {subjectLabels[entry.subject] ?? entry.subject}
                            </p>
                            <p className="text-xs text-slate-500">
                              {entry.teacher.firstName[0]}. {entry.teacher.lastName}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
