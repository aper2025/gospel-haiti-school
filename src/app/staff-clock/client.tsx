"use client";

import { useState, useTransition } from "react";
import { staffClockAction } from "./actions";

type Props = {
  staff: { id: string; firstName: string; lastName: string }[];
  statusMap: Record<string, { signedIn: boolean; signedOut: boolean }>;
};

export function StaffClockClient({ staff, statusMap }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedStaff = staff.find((s) => s.id === selected);
  const status = selected ? statusMap[selected] : null;

  function handleClock(action: "in" | "out") {
    if (!selected) return;
    setMessage(null);
    startTransition(async () => {
      const result = await staffClockAction(selected, pin, action);
      if (result.error) {
        const errors: Record<string, string> = {
          invalid_pin: "Code PIN invalide",
          not_signed_in: "Pas encore pointé aujourd'hui",
          already_signed_out: "Déjà pointé en sortie",
          staff_not_found: "Personnel non trouvé",
        };
        setMessage({ text: errors[result.error] ?? result.error, type: "error" });
      } else {
        setMessage({ text: `${result.name} — ${action === "in" ? "Arrivée" : "Départ"} enregistré`, type: "success" });
        setPin("");
        setSelected(null);
      }
    });
  }

  return (
    <div>
      {/* Feedback message */}
      {message && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
          message.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Step 1: Select name */}
      {!selected ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {staff.map((s) => {
            const st = statusMap[s.id];
            const signedIn = st?.signedIn && !st?.signedOut;
            const done = st?.signedOut;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { setSelected(s.id); setMessage(null); }}
                className={`rounded-xl border p-4 text-left transition-all hover:shadow ${
                  done
                    ? "border-green-200 bg-green-50"
                    : signedIn
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-sm font-medium text-slate-900">
                  {s.firstName} {s.lastName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {done ? "Journée complète" : signedIn ? "Sur place" : "Non pointé"}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        /* Step 2: Enter PIN and choose action */
        <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 text-center">
            {selectedStaff?.firstName} {selectedStaff?.lastName}
          </h2>
          <p className="text-xs text-slate-500 text-center mt-1">
            {status?.signedOut
              ? "Journée complète"
              : status?.signedIn
                ? "Sur place — prêt pour le départ"
                : "Non pointé — prêt pour l'arrivée"}
          </p>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 text-center">
              Code PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em] text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="****"
              autoFocus
            />
          </div>

          <div className="mt-6 flex gap-3">
            {!status?.signedIn && (
              <button
                type="button"
                onClick={() => handleClock("in")}
                disabled={isPending || pin.length !== 4}
                className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
              >
                {isPending ? "..." : "Arrivée"}
              </button>
            )}
            {status?.signedIn && !status?.signedOut && (
              <button
                type="button"
                onClick={() => handleClock("out")}
                disabled={isPending || pin.length !== 4}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {isPending ? "..." : "Départ"}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => { setSelected(null); setPin(""); }}
            className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-700"
          >
            &larr; Retour à la liste
          </button>
        </div>
      )}
    </div>
  );
}
