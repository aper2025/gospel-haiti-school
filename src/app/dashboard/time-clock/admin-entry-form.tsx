"use client";

import { useTransition } from "react";
import { adminRecordEntry } from "./actions";

type Props = {
  staff: { id: string; firstName: string; lastName: string }[];
  translations: { save: string; loading: string };
};

export function AdminEntryForm({ staff, translations: t }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => { await adminRecordEntry(formData); });
  }

  return (
    <form action={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-500">Personnel</label>
        <select name="staffId" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
          <option value="">—</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Date</label>
        <input type="date" name="date" required defaultValue={new Date().toISOString().split("T")[0]}
          className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Arrivée</label>
        <input type="time" name="signInAt" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Départ</label>
        <input type="time" name="signOutAt" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Notes</label>
        <input type="text" name="notes" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
      </div>
      <button type="submit" disabled={isPending}
        className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
        {isPending ? t.loading : t.save}
      </button>
    </form>
  );
}
