"use client";

import { useState, useTransition } from "react";
import { createCalendarEvent } from "./actions";

type Props = {
  translations: { save: string; loading: string };
};

export function CalendarEventForm({ translations: t }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createCalendarEvent(formData);
      if (result.error) {
        setError(result.error === "validation" ? "Veuillez remplir tous les champs." : result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">Événement ajouté</div>
      )}
      <form action={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500">Type</label>
            <select name="type" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
              <option value="HOLIDAY">Jour férié</option>
              <option value="NO_SCHOOL">Pas d'école</option>
              <option value="EXAM_WEEK">Semaine d'examens</option>
              <option value="TRIMESTRE_START">Début trimestre</option>
              <option value="TRIMESTRE_END">Fin trimestre</option>
              <option value="STAFF_MEETING">Réunion personnel</option>
              <option value="SPECIAL_EVENT">Événement spécial</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500">Titre</label>
            <input type="text" name="title" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Début</label>
            <input type="date" name="startDate" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Fin (optionnel)</label>
            <input type="date" name="endDate" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Description</label>
          <input type="text" name="description" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={isPending}
            className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
            {isPending ? t.loading : t.save}
          </button>
        </div>
      </form>
    </div>
  );
}
