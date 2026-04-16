"use client";

import { useTransition } from "react";
import { createSchoolYear } from "./actions";

type Props = { translations: { save: string; loading: string } };

export function SchoolYearManager({ translations: t }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => { await createSchoolYear(formData); });
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-500">Libellé</label>
        <input type="text" name="label" required placeholder="2026-27"
          className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm w-28" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Début</label>
        <input type="date" name="startDate" required
          className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Fin</label>
        <input type="date" name="endDate" required
          className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>
      <div className="flex items-center gap-2 pb-1">
        <input type="checkbox" name="isActive" id="isActive" className="h-4 w-4 rounded border-slate-300" />
        <label htmlFor="isActive" className="text-sm text-slate-700">Active</label>
      </div>
      <button type="submit" disabled={isPending}
        className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
        {isPending ? t.loading : t.save}
      </button>
    </form>
  );
}
