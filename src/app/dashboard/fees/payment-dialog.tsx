"use client";

import { useState, useTransition } from "react";
import { recordPayment } from "./actions";

type Props = {
  accountId: string;
  studentName: string;
  translations: { save: string; cancel: string; loading: string };
};

export function PaymentDialog({ accountId, studentName, translations: t }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await recordPayment(formData);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-blue-700 hover:text-blue-900"
      >
        + Paiement
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl mx-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Paiement — {studentName}
        </h2>
        <form action={handleSubmit} className="mt-4 space-y-4">
          <input type="hidden" name="accountId" value={accountId} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Montant (HTG)</label>
              <input
                type="number"
                name="amountHtg"
                min={1}
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Méthode</label>
            <select
              name="method"
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option value="CASH">Espèces</option>
              <option value="CHECK">Chèque</option>
              <option value="TRANSFER">Virement</option>
              <option value="MONEY_ORDER">Mandat</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Notes</label>
            <input
              type="text"
              name="notes"
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
