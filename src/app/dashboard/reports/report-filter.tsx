"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  label: string;
  param: string;
  current: string | null;
  options: { value: string; label: string }[];
};

export function ReportFilter({ label, param, current, options }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "trimestre");
    params.set(param, value);
    router.push(`/dashboard/reports?${params.toString()}`);
  }

  return (
    <div>
      <label className="block text-xs font-medium text-slate-500">{label}</label>
      <select
        value={current ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
