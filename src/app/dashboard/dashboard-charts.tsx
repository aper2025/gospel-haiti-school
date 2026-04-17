"use client";

import { useEffect, useState } from "react";

type Props = {
  attendanceByClass: { label: string; present: number; absent: number; late: number }[];
  groupDistribution: { name: string; value: number; color: string }[];
  behaviorOverview: { level: string; count: number }[];
};

export function DashboardCharts({ attendanceByClass, groupDistribution, behaviorOverview }: Props) {
  const [Charts, setCharts] = useState<typeof import("./charts-inner") | null>(null);

  useEffect(() => {
    import("./charts-inner").then(setCharts);
  }, []);

  if (!Charts) {
    return (
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-[310px] animate-shimmer" />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-[310px] animate-shimmer" />
      </div>
    );
  }

  return (
    <Charts.ChartsInner
      attendanceByClass={attendanceByClass}
      groupDistribution={groupDistribution}
      behaviorOverview={behaviorOverview}
    />
  );
}
