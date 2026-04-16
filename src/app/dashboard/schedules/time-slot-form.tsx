"use client";

import { useState, useTransition } from "react";
import { createTimeSlot } from "./actions";

type Props = {
  translations: { save: string; loading: string };
};

export function TimeSlotForm({ translations: t }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createTimeSlot(formData);
      if (result.error) {
        setError(result.error === "validation" ? "Veuillez remplir tous les champs correctement." : result.error);
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
        <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">Créneau ajouté</div>
      )}
      <form action={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">Nom</label>
          <input type="text" name="label" required placeholder="Bloc 1"
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 w-32" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Jour</label>
          <select name="dayOfWeek" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
            <option value="MONDAY">Lundi</option>
            <option value="TUESDAY">Mardi</option>
            <option value="WEDNESDAY">Mercredi</option>
            <option value="THURSDAY">Jeudi</option>
            <option value="FRIDAY">Vendredi</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Début</label>
          <input type="time" name="startTime" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Fin</label>
          <input type="time" name="endTime" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Ordre</label>
          <input type="number" name="orderIdx" required min={0} defaultValue={0}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 w-16" />
        </div>
        <div className="flex items-center gap-2 pb-1">
          <input type="checkbox" name="isBreak" id="isBreak" className="h-4 w-4 rounded border-slate-300" />
          <label htmlFor="isBreak" className="text-sm text-slate-700">Pause</label>
        </div>
        <button type="submit" disabled={isPending}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {isPending ? t.loading : t.save}
        </button>
      </form>
    </div>
  );
}
