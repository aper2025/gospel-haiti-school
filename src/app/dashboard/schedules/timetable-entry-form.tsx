"use client";

import { useState, useTransition } from "react";
import { createTimetableEntry } from "./actions";

type Props = {
  classes: { id: string; label: string }[];
  timeSlots: { id: string; label: string }[];
  staff: { id: string; firstName: string; lastName: string }[];
  subjects: string[];
  subjectLabels: Record<string, string>;
  translations: { save: string; loading: string };
};

export function TimetableEntryForm({ classes, timeSlots, staff, subjects, subjectLabels, translations: t }: Props) {
  const [isPending, startTransition] = useTransition();
  const [conflict, setConflict] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setConflict(null);
    startTransition(async () => {
      const result = await createTimetableEntry(formData);
      if (result.error === "conflict") {
        setConflict(`Conflit: enseignant déjà assigné à ${result.conflictClass}`);
      }
    });
  }

  return (
    <div>
      {conflict && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {conflict}
        </div>
      )}
      <form action={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">Classe</label>
          <select name="classId" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Créneau</label>
          <select name="timeSlotId" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
            {timeSlots.map((ts) => <option key={ts.id} value={ts.id}>{ts.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Matière</label>
          <select name="subject" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
            {subjects.map((s) => <option key={s} value={s}>{subjectLabels[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Enseignant</label>
          <select name="teacherId" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
            {staff.map((s) => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
          </select>
        </div>
        <button type="submit" disabled={isPending}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {isPending ? t.loading : t.save}
        </button>
      </form>
    </div>
  );
}
