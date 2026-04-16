"use client";

import { useState, useTransition } from "react";
import { createObservation } from "../actions";

type Props = {
  staffId: string;
  translations: { save: string; loading: string };
};

export function ObservationForm({ staffId, translations: t }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="text-sm text-blue-700 hover:text-blue-900">
        + Nouvelle observation
      </button>
    );
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createObservation(formData);
      setOpen(false);
    });
  }

  return (
    <form action={handleSubmit} className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <input type="hidden" name="staffId" value={staffId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600">Date</label>
          <input type="date" name="date" required defaultValue={new Date().toISOString().split("T")[0]}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Score (optionnel)</label>
          <input type="number" name="score" min={0} max={100}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Forces</label>
        <textarea name="strengths" rows={2} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Points à améliorer</label>
        <textarea name="improvements" rows={2} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Plan d'action</label>
        <textarea name="actionPlan" rows={2} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Date de suivi</label>
        <input type="date" name="followUpDate" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          Annuler
        </button>
        <button type="submit" disabled={isPending}
          className="rounded-lg bg-blue-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50">
          {isPending ? t.loading : t.save}
        </button>
      </div>
    </form>
  );
}
