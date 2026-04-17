"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

type Props = {
  attendanceByClass: { label: string; present: number; absent: number; late: number }[];
  groupDistribution: { name: string; value: number; color: string }[];
  behaviorOverview: { level: string; count: number }[];
};

export function ChartsInner({ attendanceByClass, groupDistribution, behaviorOverview }: Props) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Attendance by class */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Présence par classe
        </h3>
        {attendanceByClass.some((c) => c.present + c.absent + c.late > 0) ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attendanceByClass} barGap={2}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="present" name="Présents" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" name="Retards" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" name="Absents" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400 py-12 text-center">Aucune donnée de présence aujourd'hui</p>
        )}
      </div>

      {/* Group distribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Répartition des groupes
        </h3>
        {groupDistribution.some((g) => g.value > 0) ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={groupDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {groupDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400 py-12 text-center">Aucune donnée cette semaine</p>
        )}
      </div>

      {/* Behavior overview */}
      {behaviorOverview.some((b) => b.count > 0) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Vue d'ensemble du comportement
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={behaviorOverview} layout="vertical" barSize={20}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="level" type="category" tick={{ fontSize: 11 }} width={30} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="count" name="Élèves" radius={[0, 6, 6, 0]}>
                {behaviorOverview.map((entry) => (
                  <Cell
                    key={entry.level}
                    fill={
                      entry.level === "L0" ? "#10b981" :
                      entry.level === "L1" ? "#3b82f6" :
                      entry.level === "L2" ? "#f59e0b" :
                      entry.level === "L3" ? "#f97316" :
                      "#ef4444"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
