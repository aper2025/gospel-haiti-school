"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useTransition } from "react";
import { createBulkEvaluations } from "./actions";

const GROUP_COLORS: Record<string, string> = {
  G1: "bg-green-100 text-green-800",
  G2: "bg-blue-100 text-blue-800",
  G3: "bg-amber-100 text-amber-800",
  G4: "bg-red-100 text-red-800",
};

type Props = {
  classes: { id: string; label: string }[];
  subjects: string[];
  subjectLabels: Record<string, string>;
  students: { id: string; firstName: string; lastName: string }[];
  evaluations: {
    id: string;
    studentId: string;
    type: string;
    scorePct: number;
    letter: string;
    group: string;
    date: string;
    notes: string | null;
  }[];
  placements: {
    studentId: string;
    avgScore: number;
    group: string;
  }[];
  selectedClassId: string | null;
  selectedSubject: string;
  translations: {
    score: string;
    letterGrade: string;
    group: string;
    save: string;
    loading: string;
    noData: string;
    add: string;
    evalTypes: Record<string, string>;
    groups: Record<string, string>;
  };
};

export function GradebookView({
  classes,
  subjects,
  subjectLabels,
  students,
  evaluations,
  placements,
  selectedClassId,
  selectedSubject,
  translations: t,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showEntry, setShowEntry] = useState(false);
  const [entryType, setEntryType] = useState("PETITE_EVALUATION");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [scores, setScores] = useState<Record<string, string>>({});

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/dashboard/gradebook?${params.toString()}`);
    },
    [router, searchParams],
  );

  const placementMap = Object.fromEntries(
    placements.map((p) => [p.studentId, p]),
  );

  // Group distribution counts
  const groupCounts = { G1: 0, G2: 0, G3: 0, G4: 0 };
  for (const p of placements) {
    if (p.group in groupCounts) groupCounts[p.group as keyof typeof groupCounts]++;
  }

  function handleScoreChange(studentId: string, value: string) {
    setScores((prev) => ({ ...prev, [studentId]: value }));
  }

  async function handleBulkSave() {
    if (!selectedClassId || !selectedSubject) return;

    const entries = Object.entries(scores)
      .filter(([, v]) => v !== "" && !isNaN(Number(v)))
      .map(([studentId, v]) => ({
        studentId,
        scorePct: Number(v),
      }));

    if (!entries.length) return;

    startTransition(async () => {
      await createBulkEvaluations(
        selectedClassId,
        selectedSubject,
        entryType,
        entryDate,
        entries,
      );
      setScores({});
      setShowEntry(false);
    });
  }

  return (
    <div className="mt-4">
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
        <select
          value={selectedSubject}
          onChange={(e) => updateParam("subject", e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">-- Matière --</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{subjectLabels[s]}</option>
          ))}
        </select>
        {selectedSubject && (
          <button
            type="button"
            onClick={() => setShowEntry(!showEntry)}
            className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
          >
            + {t.add}
          </button>
        )}
      </div>

      {/* Group distribution bar */}
      {selectedSubject && placements.length > 0 && (
        <div className="mb-4 flex gap-3">
          {(["G1", "G2", "G3", "G4"] as const).map((g) => (
            <div
              key={g}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${GROUP_COLORS[g]}`}
            >
              {g}: {groupCounts[g]}
            </div>
          ))}
        </div>
      )}

      {/* Bulk score entry */}
      {showEntry && selectedSubject && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-wrap gap-3 mb-3">
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              {Object.entries(t.evalTypes).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="w-48 text-sm font-medium text-slate-700 truncate">
                  {s.lastName}, {s.firstName}
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  value={scores[s.id] ?? ""}
                  onChange={(e) => handleScoreChange(s.id, e.target.value)}
                  className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-center"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleBulkSave}
              disabled={isPending}
              className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? t.loading : t.save}
            </button>
          </div>
        </div>
      )}

      {/* Student list with placements and recent scores */}
      {!selectedSubject ? (
        <p className="text-sm text-slate-400 py-8 text-center">
          Sélectionnez une matière
        </p>
      ) : students.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">{t.noData}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Nom
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">
                  {t.group}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">
                  Moy.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Dernières notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => {
                const pl = placementMap[s.id];
                const studentEvals = evaluations
                  .filter((e) => e.studentId === s.id)
                  .slice(0, 5);

                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900">
                      {s.lastName}, {s.firstName}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {pl ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${GROUP_COLORS[pl.group] ?? ""}`}
                        >
                          {pl.group}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center text-sm text-slate-700">
                      {pl ? `${pl.avgScore.toFixed(0)}%` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1.5">
                        {studentEvals.map((e) => (
                          <span
                            key={e.id}
                            className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                            title={`${e.date} — ${e.type}`}
                          >
                            {e.scorePct}%
                          </span>
                        ))}
                        {studentEvals.length === 0 && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
