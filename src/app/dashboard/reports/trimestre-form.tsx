"use client";

import { useTransition } from "react";
import { upsertTrimestre } from "./actions";

type Props = { translations: { save: string; loading: string } };

export function TrimestreForm({ translations: t }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => { await upsertTrimestre(formData); });
  }

  return (
    <form action={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-500">Trimestre</label>
        <select name="number" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
          <option value="T1">Trimestre 1</option>
          <option value="T2">Trimestre 2</option>
          <option value="T3">Trimestre 3</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Début</label>
        <input type="date" name="startDate" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Fin</label>
        <input type="date" name="endDate" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>
      <button type="submit" disabled={isPending}
        className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
        {isPending ? t.loading : t.save}
      </button>
    </form>
  );
}
