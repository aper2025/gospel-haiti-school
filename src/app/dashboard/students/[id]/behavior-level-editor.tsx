"use client";

import { useState, useTransition } from "react";
import { updateBehaviorLevel } from "./behavior-actions";

const LEVELS = [
  { key: "L0", label: "L0 — Aucun problème", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { key: "L1", label: "L1 — Problème noté", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { key: "L2", label: "L2 — Répétition", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { key: "L3", label: "L3 — Contact parent", color: "bg-orange-100 text-orange-800 border-orange-300" },
  { key: "L4", label: "L4 — Administration", color: "bg-red-100 text-red-800 border-red-300" },
  { key: "L5", label: "L5 — Rencontre parents", color: "bg-red-200 text-red-900 border-red-400" },
  { key: "L6", label: "L6 — Directeur", color: "bg-red-300 text-red-950 border-red-500" },
];

type Props = {
  studentId: string;
  currentLevel: string;
};

export function BehaviorLevelEditor({ studentId, currentLevel }: Props) {
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState(currentLevel);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  function handleSave() {
    if (selected === currentLevel && !reason) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      await updateBehaviorLevel(studentId, selected, reason);
      setEditing(false);
      setReason("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  const current = LEVELS.find((l) => l.key === currentLevel) ?? LEVELS[0];

  if (!editing) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${current.color}`}>
              {current.label}
            </span>
            {success && <span className="text-xs text-emerald-600 font-medium">Mis à jour</span>}
          </div>
          <button
            type="button"
            onClick={() => { setEditing(true); setSelected(currentLevel); }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Modifier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-1.5">
        {LEVELS.map((lvl) => (
          <button
            key={lvl.key}
            type="button"
            onClick={() => setSelected(lvl.key)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-left transition-all ${
              selected === lvl.key
                ? lvl.color + " ring-2 ring-blue-500 ring-offset-1"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {lvl.label}
            {lvl.key === currentLevel && (
              <span className="text-[10px] text-slate-400 ml-auto">(actuel)</span>
            )}
          </button>
        ))}
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Raison du changement</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Ex: Amélioration du comportement, rencontre avec les parents effectuée..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
