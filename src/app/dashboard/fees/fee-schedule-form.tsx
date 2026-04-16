"use client";

import { useTransition } from "react";
import { upsertFeeSchedule } from "./actions";

type Props = {
  classes: { id: string; label: string }[];
  translations: { save: string; loading: string };
};

export function FeeScheduleForm({ classes, translations: t }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await upsertFeeSchedule(formData);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-500">Classe</label>
        <select
          name="classId"
          required
          className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Montant (HTG)</label>
        <input
          type="number"
          name="amountHtg"
          min={0}
          required
          placeholder="0"
          className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Notes</label>
        <input
          type="text"
          name="notes"
          placeholder="Optionnel"
          className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? t.loading : t.save}
      </button>
    </form>
  );
}
