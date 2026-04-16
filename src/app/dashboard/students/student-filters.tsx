"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  classes: { id: string; label: string }[];
  current: { class?: string; status?: string; q?: string };
  translations: Record<string, string>;
};

export function StudentFilters({ classes, current, translations: t }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/dashboard/students?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <input
        type="search"
        placeholder={t.search + "..."}
        defaultValue={current.q ?? ""}
        onChange={(e) => updateParam("q", e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-64"
      />
      <select
        value={current.class ?? ""}
        onChange={(e) => updateParam("class", e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">{t.allClasses}</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <select
        value={current.status ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">{t.allStatuses}</option>
        <option value="ACTIVE">{t.active}</option>
        <option value="WITHDRAWN">{t.withdrawn}</option>
        <option value="GRADUATED">{t.graduated}</option>
      </select>
    </div>
  );
}
