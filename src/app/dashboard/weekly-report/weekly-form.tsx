"use client";

import { useTransition } from "react";
import { submitWeeklyData } from "./actions";

type Props = {
  classCodes: string[];
  weekStart: string;
  translations: { save: string; loading: string };
};

export function WeeklyForm({ classCodes, weekStart, translations: t }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => { await submitWeeklyData(formData); });
  }

  return (
    <form action={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <input type="hidden" name="weekStart" value={weekStart} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">Classe</label>
          <select name="classCode" required className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
            {classCodes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Total élèves</label>
          <input type="number" name="totalStudents" required min={0}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { name: "group1Count", label: "G1 (80%+)", color: "border-green-300" },
          { name: "group2Count", label: "G2 (70-79%)", color: "border-blue-300" },
          { name: "group3Count", label: "G3 (40-69%)", color: "border-amber-300" },
          { name: "group4Count", label: "G4 (<40%)", color: "border-red-300" },
        ].map((g) => (
          <div key={g.name}>
            <label className="block text-xs font-medium text-slate-500">{g.label}</label>
            <input type="number" name={g.name} required min={0} defaultValue={0}
              className={`mt-1 block w-full rounded-lg border ${g.color} px-3 py-2 text-sm text-center`} />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500">Noms G3 et G4</label>
        <textarea name="group3And4Names" rows={2}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-500">Matières problématiques</label>
          <input type="text" name="problematicSubjects"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Tutorat assigné</label>
          <input type="text" name="tutoringAssigned"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500">Analyse des causes</label>
        <textarea name="rootCauseAnalysis" rows={2}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Plan d'action</label>
        <textarea name="actionPlan" rows={2}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Problèmes de comportement</label>
        <textarea name="behaviorIssues" rows={2}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Notes</label>
        <textarea name="notes" rows={2}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={isPending}
          className="rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {isPending ? t.loading : t.save}
        </button>
      </div>
    </form>
  );
}
