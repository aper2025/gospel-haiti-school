"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  classes: { id: string; label: string }[];
  currentClass?: string;
  currentStatus?: string;
};

export function FeeFilters({ classes, currentClass, currentStatus }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/dashboard/fees?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex gap-2">
      <select
        value={currentClass ?? ""}
        onChange={(e) => updateParam("class", e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Toutes les classes</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </select>
      <select
        value={currentStatus ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Tous les statuts</option>
        <option value="PAID_IN_FULL">Payé</option>
        <option value="PARTIAL">Partiel</option>
        <option value="UNPAID">Impayé</option>
        <option value="OVERDUE">En retard</option>
      </select>
    </div>
  );
}
