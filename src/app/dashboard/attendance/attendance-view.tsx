"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect, useTransition } from "react";
import { markAttendanceBulk } from "./actions";
import {
  enqueueAttendance,
  dequeueAll,
  removeFromQueue,
  queueCount,
  type QueuedAttendance,
} from "@/lib/offline/attendance-queue";

const CODES = ["P", "L_E", "L_U", "A_E", "A_U"] as const;

const CODE_COLORS: Record<string, string> = {
  P: "bg-green-100 text-green-800 border-green-300",
  L_E: "bg-amber-100 text-amber-800 border-amber-300",
  L_U: "bg-orange-100 text-orange-800 border-orange-300",
  A_E: "bg-red-100 text-red-800 border-red-300",
  A_U: "bg-red-200 text-red-900 border-red-400",
};

type Props = {
  classes: { id: string; label: string; code: string }[];
  students: { id: string; firstName: string; lastName: string }[];
  existing: Record<string, { code: string; notes: string | null }>;
  selectedClassId: string | null;
  selectedDate: string;
  staffId: string | null;
  translations: Record<string, string>;
};

export function AttendanceView({
  classes,
  students,
  existing,
  selectedClassId,
  selectedDate,
  staffId,
  translations: t,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for attendance codes
  const [marks, setMarks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const s of students) {
      init[s.id] = existing[s.id]?.code ?? "";
    }
    return init;
  });

  // Offline state
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => { setIsOnline(true); syncQueue(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    queueCount().then(setPendingCount);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Reset marks when students/existing change
  useEffect(() => {
    const init: Record<string, string> = {};
    for (const s of students) {
      init[s.id] = existing[s.id]?.code ?? "";
    }
    setMarks(init);
  }, [students, existing]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`/dashboard/attendance?${params.toString()}`);
    },
    [router, searchParams],
  );

  function setCode(studentId: string, code: string) {
    setMarks((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === code ? "" : code,
    }));
  }

  function markAllPresent() {
    const next: Record<string, string> = {};
    for (const s of students) {
      next[s.id] = "P";
    }
    setMarks(next);
  }

  async function syncQueue() {
    const queued = await dequeueAll();
    if (!queued.length) return;

    try {
      const res = await fetch("/api/attendance/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: queued }),
      });
      if (res.ok) {
        const { synced } = await res.json();
        for (const uuid of synced) {
          await removeFromQueue(uuid);
        }
        setPendingCount(await queueCount());
      }
    } catch {
      // Still offline — will retry
    }
  }

  async function handleSave() {
    if (!staffId) return;
    setSaving(true);

    const entries = Object.entries(marks)
      .filter(([, code]) => code !== "")
      .map(([studentId, code]) => ({
        studentId,
        code,
        clientUuid: `${studentId}-${selectedDate}-${Date.now()}`,
      }));

    if (!entries.length) {
      setSaving(false);
      return;
    }

    if (isOnline) {
      startTransition(async () => {
        await markAttendanceBulk(selectedDate, entries);
        setSaving(false);
      });
    } else {
      // Queue offline
      for (const entry of entries) {
        const queued: QueuedAttendance = {
          ...entry,
          date: selectedDate,
          markedById: staffId,
          queuedAt: Date.now(),
        };
        await enqueueAttendance(queued);
      }
      setPendingCount(await queueCount());
      setSaving(false);
    }
  }

  return (
    <div className="mt-4">
      {/* Offline banner */}
      {(!isOnline || pendingCount > 0) && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-medium text-amber-800">
              {!isOnline ? t.offlineMode : ""}
            </span>
          </div>
          {pendingCount > 0 && (
            <span className="text-sm text-amber-700">
              {t.pendingSync.replace("{count}", String(pendingCount))}
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={selectedClassId ?? ""}
          onChange={(e) => updateParam("class", e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => updateParam("date", e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={markAllPresent}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {t.markAll} P
        </button>
      </div>

      {/* Attendance grid */}
      {students.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">{t.noData}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 sticky left-0 bg-slate-50 z-10">
                  Nom
                </th>
                {CODES.map((code) => (
                  <th key={code} className="px-2 py-3 text-center text-xs font-medium uppercase text-slate-500 w-16">
                    {code.replace("_", " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-900 sticky left-0 bg-white z-10 whitespace-nowrap">
                    {s.lastName}, {s.firstName}
                  </td>
                  {CODES.map((code) => {
                    const selected = marks[s.id] === code;
                    return (
                      <td key={code} className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setCode(s.id, code)}
                          className={`inline-flex h-8 w-12 items-center justify-center rounded-md border text-xs font-semibold transition-colors ${
                            selected
                              ? CODE_COLORS[code]
                              : "border-slate-200 text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          {code.replace("_", "")}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Save */}
      {students.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isPending}
            className="rounded-lg bg-blue-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving || isPending ? t.loading : t.save}
          </button>
        </div>
      )}
    </div>
  );
}
