"use client";

import { useState, useTransition } from "react";
import { createIncident } from "./actions";

type Props = {
  students: { id: string; firstName: string; lastName: string }[];
  translations: { add: string; save: string; cancel: string; loading: string };
};

export function NewIncidentDialog({ students, translations: t }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createIncident(formData);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
      >
        + {t.add}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl mx-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Nouvel incident
        </h2>
        <form action={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Élève
            </label>
            <select
              name="studentId"
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option value="">—</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.lastName}, {s.firstName}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                type="date"
                name="date"
                required
                defaultValue={new Date().toLocaleDateString("en-CA", { timeZone: "America/Port-au-Prince" })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Niveau
              </label>
              <select
                name="level"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                {["L1", "L2", "L3", "L4", "L5", "L6"].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              name="description"
              required
              rows={3}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Résolution
            </label>
            <textarea
              name="resolution"
              rows={2}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {isPending ? t.loading : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
