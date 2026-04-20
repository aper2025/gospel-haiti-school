"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useTransition } from "react";
import { createBulkEvaluations } from "./actions";

const GROUP_COLORS: Record<string, string> = {
  G1: "bg-emerald-100 text-emerald-800",
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
    subject: string;
    type: string;
    scorePct: number;
    letter: string;
    group: string;
    date: string;
    notes: string | null;
  }[];
  placements: {
    studentId: string;
    subject: string;
    avgScore: number;
    group: string;
  }[];
  selectedClassId: string | null;
  selectedSubject: string;
  isLowerGrade: boolean;
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
  isLowerGrade,
  translations: t,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showEntry, setShowEntry] = useState(false);
  const [entryType, setEntryType] = useState("PETITE_EVALUATION");
  const [entrySubject, setEntrySubject] = useState(selectedSubject || subjects[0]);
  const [entryDate, setEntryDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "America/Port-au-Prince" }));
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

  // For lower grades: compute overall average per student across all subjects
  const studentOverview = isLowerGrade
    ? students.map((s) => {
        const studentEvals = evaluations.filter((e) => e.studentId === s.id);
        const avgAll = studentEvals.length > 0
          ? studentEvals.reduce((sum, e) => sum + e.scorePct, 0) / studentEvals.length
          : null;
        // Per-subject breakdown
        const bySubject: Record<string, { avg: number; count: number }> = {};
        for (const e of studentEvals) {
          if (!bySubject[e.subject]) bySubject[e.subject] = { avg: 0, count: 0 };
          bySubject[e.subject].avg += e.scorePct;
          bySubject[e.subject].count++;
        }
        for (const k of Object.keys(bySubject)) {
          bySubject[k].avg = bySubject[k].avg / bySubject[k].count;
        }
        return { ...s, avgAll, bySubject, evalCount: studentEvals.length };
      })
    : [];

  // For upper grades: single subject view
  const placementMap = Object.fromEntries(
    placements.map((p) => [p.studentId, p]),
  );

  const groupCounts = { G1: 0, G2: 0, G3: 0, G4: 0 };
  for (const p of placements) {
    if (p.group in groupCounts) groupCounts[p.group as keyof typeof groupCounts]++;
  }

  function handleScoreChange(studentId: string, value: string) {
    setScores((prev) => ({ ...prev, [studentId]: value }));
  }

  async function handleBulkSave() {
    if (!selectedClassId) return;
    const sub = isLowerGrade ? entrySubject : selectedSubject;
    if (!sub) return;

    const entries = Object.entries(scores)
      .filter(([, v]) => v !== "" && !isNaN(Number(v)))
      .map(([studentId, v]) => ({ studentId, scorePct: Number(v) }));

    if (!entries.length) return;

    startTransition(async () => {
      await createBulkEvaluations(selectedClassId, sub, entryType, entryDate, entries);
      setScores({});
      setShowEntry(false);
    });
  }

  // Subjects that have data for this class (lower grade)
  const activeSubjects = isLowerGrade
    ? [...new Set(evaluations.map((e) => e.subject))].sort()
    : [];

  return (
    <div className="mt-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={selectedClassId ?? ""}
          onChange={(e) => updateParam("class", e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        {/* Only show subject picker for upper grades */}
        {!isLowerGrade && (
          <select
            value={selectedSubject}
            onChange={(e) => updateParam("subject", e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Matière --</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{subjectLabels[s]}</option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => setShowEntry(!showEntry)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + {t.add}
        </button>
      </div>

      {/* Group distribution */}
      {(isLowerGrade || selectedSubject) && placements.length > 0 && !isLowerGrade && (
        <div className="mb-4 flex gap-3">
          {(["G1", "G2", "G3", "G4"] as const).map((g) => (
            <div key={g} className={`rounded-lg px-3 py-2 text-sm font-medium ${GROUP_COLORS[g]}`}>
              {g}: {groupCounts[g]}
            </div>
          ))}
        </div>
      )}

      {/* Bulk score entry */}
      {showEntry && (
        <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex flex-wrap gap-3 mb-4">
            {isLowerGrade && (
              <select
                value={entrySubject}
                onChange={(e) => setEntrySubject(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>{subjectLabels[s]}</option>
                ))}
              </select>
            )}
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
              type="date" value={entryDate}
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
                  type="number" min={0} max={100} placeholder="0-100"
                  value={scores[s.id] ?? ""}
                  onChange={(e) => handleScoreChange(s.id, e.target.value)}
                  className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 text-center"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={handleBulkSave} disabled={isPending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isPending ? t.loading : t.save}
            </button>
          </div>
        </div>
      )}

      {/* ── LOWER GRADE VIEW: All-subject overview ── */}
      {isLowerGrade && (
        <div>
          {students.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">{t.noData}</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 sticky left-0 bg-slate-50 z-10">
                      Élève
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase text-slate-500">
                      Moy.
                    </th>
                    {activeSubjects.map((sub) => (
                      <th key={sub} className="px-3 py-3 text-center text-xs font-medium uppercase text-slate-500 whitespace-nowrap">
                        {(subjectLabels[sub] ?? sub).slice(0, 8)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentOverview.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-900 sticky left-0 bg-white z-10 whitespace-nowrap">
                        {s.lastName}, {s.firstName}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {s.avgAll != null ? (
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            s.avgAll >= 80 ? GROUP_COLORS.G1 :
                            s.avgAll >= 70 ? GROUP_COLORS.G2 :
                            s.avgAll >= 40 ? GROUP_COLORS.G3 :
                            GROUP_COLORS.G4
                          }`}>
                            {s.avgAll.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      {activeSubjects.map((sub) => {
                        const d = s.bySubject[sub];
                        return (
                          <td key={sub} className="px-3 py-2.5 text-center text-xs text-slate-600">
                            {d ? `${d.avg.toFixed(0)}%` : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── UPPER GRADE VIEW: Subject-specific ── */}
      {!isLowerGrade && (
        <>
          {!selectedSubject ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              Sélectionnez une matière
            </p>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">{t.noData}</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Nom</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">{t.group}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Moy.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Dernières notes</th>
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
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${GROUP_COLORS[pl.group] ?? ""}`}>
                              {pl.group}
                            </span>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center text-sm text-slate-700">
                          {pl ? `${pl.avgScore.toFixed(0)}%` : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1.5">
                            {studentEvals.map((e) => (
                              <span key={e.id} className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                                title={`${e.date} — ${e.type}`}>
                                {e.scorePct}%
                              </span>
                            ))}
                            {studentEvals.length === 0 && <span className="text-xs text-slate-400">—</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
