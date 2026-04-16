"use client";

import { useState } from "react";
import {
  Clock, LogIn, LogOut, UserX, AlertTriangle,
  ClipboardCheck, BookOpen, ShieldAlert, ChevronDown,
} from "lucide-react";

type StaffEntry = {
  name: string;
  signInAt: string | null;
  signOutAt: string | null;
  hoursWorked: number | null;
};

type ClassSummary = {
  classId: string;
  label: string;
  totalStudents: number;
  attendance: { present: number; late: number; absent: number; unmarked: number };
  avgScore: number | null;
  behaviorFlags: number;
  behaviorStudents: { name: string; level: string }[];
};

type Props = {
  staffSummary: {
    total: number;
    signedIn: number;
    signedOut: number;
    missing: number;
    lateCount: number;
    entries: StaffEntry[];
    notSignedIn: string[];
  };
  classSummaries: ClassSummary[];
};

export function DailySummary({ staffSummary, classSummaries }: Props) {
  const [selectedClass, setSelectedClass] = useState(classSummaries[0]?.classId ?? "");
  const selected = classSummaries.find((c) => c.classId === selectedClass);

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Section 1: Time Clock Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Pointage du jour</h2>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
          <MiniStat icon={LogIn} value={staffSummary.signedIn} label="Présents" color="text-emerald-600" />
          <MiniStat icon={LogOut} value={staffSummary.signedOut} label="Partis" color="text-blue-600" />
          <MiniStat icon={UserX} value={staffSummary.missing} label="Absents" color="text-red-600" />
          <MiniStat icon={AlertTriangle} value={staffSummary.lateCount} label="Retards" color="text-amber-600" />
        </div>

        {/* Staff list */}
        <div className="max-h-64 overflow-y-auto">
          {staffSummary.entries.map((s) => (
            <div key={s.name} className="flex items-center justify-between px-5 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
              <span className="text-sm font-medium text-slate-800">{s.name}</span>
              <div className="flex items-center gap-3">
                {s.signInAt ? (
                  <span className="text-xs text-emerald-600 font-medium">{s.signInAt}</span>
                ) : (
                  <span className="text-xs text-red-500 font-medium">Non pointé</span>
                )}
                {s.signOutAt && (
                  <span className="text-xs text-blue-600">→ {s.signOutAt}</span>
                )}
                {s.hoursWorked != null && (
                  <span className="text-xs text-slate-400 w-10 text-right">{s.hoursWorked}h</span>
                )}
              </div>
            </div>
          ))}
          {staffSummary.notSignedIn.length > 0 && staffSummary.entries.length === 0 && (
            <p className="px-5 py-4 text-sm text-slate-400 text-center">Aucun pointage aujourd'hui</p>
          )}
        </div>

        {/* Missing staff */}
        {staffSummary.notSignedIn.length > 0 && (
          <div className="bg-red-50/50 px-5 py-3 border-t border-red-100">
            <p className="text-xs font-semibold text-red-700 mb-1">Non pointés ({staffSummary.notSignedIn.length})</p>
            <p className="text-xs text-red-600">{staffSummary.notSignedIn.join(", ")}</p>
          </div>
        )}
      </div>

      {/* Section 2: Class Summary with Dropdown */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Résumé par classe</h2>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="appearance-none rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-medium pl-3 pr-8 py-1.5 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                {classSummaries.map((c) => (
                  <option key={c.classId} value={c.classId} className="text-slate-900">{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70 pointer-events-none" />
            </div>
          </div>
        </div>

        {selected ? (
          <div>
            {/* Attendance row */}
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Présence</span>
                <span className="text-xs text-slate-400 ml-auto">{selected.totalStudents} élèves</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <AttBar label="Présents" value={selected.attendance.present} total={selected.totalStudents} color="bg-emerald-500" />
                <AttBar label="Retards" value={selected.attendance.late} total={selected.totalStudents} color="bg-amber-500" />
                <AttBar label="Absents" value={selected.attendance.absent} total={selected.totalStudents} color="bg-red-500" />
                <AttBar label="Non marqués" value={selected.attendance.unmarked} total={selected.totalStudents} color="bg-slate-300" />
              </div>
            </div>

            {/* Average grade */}
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Moyenne académique</span>
              </div>
              {selected.avgScore != null ? (
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold text-slate-900">{selected.avgScore.toFixed(1)}%</span>
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                    selected.avgScore >= 80 ? "bg-emerald-100 text-emerald-700" :
                    selected.avgScore >= 70 ? "bg-blue-100 text-blue-700" :
                    selected.avgScore >= 40 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {selected.avgScore >= 80 ? "G1" : selected.avgScore >= 70 ? "G2" : selected.avgScore >= 40 ? "G3" : "G4"}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Aucune évaluation enregistrée</p>
              )}
            </div>

            {/* Behavior */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comportement</span>
                {selected.behaviorFlags > 0 && (
                  <span className="ml-auto text-xs font-bold text-red-600">{selected.behaviorFlags} signalement{selected.behaviorFlags > 1 ? "s" : ""}</span>
                )}
              </div>
              {selected.behaviorStudents.length > 0 ? (
                <div className="space-y-1.5">
                  {selected.behaviorStudents.map((s) => (
                    <div key={s.name} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{s.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        s.level >= "L4" ? "bg-red-100 text-red-700" :
                        s.level >= "L3" ? "bg-orange-100 text-orange-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {s.level}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Aucun problème de comportement</p>
              )}
            </div>
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            Aucune classe disponible
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, value, label, color }: { icon: React.ElementType; value: number; label: string; color: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <Icon className={`h-4 w-4 mx-auto ${color}`} />
      <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
      <p className="text-[10px] text-slate-500 uppercase">{label}</p>
    </div>
  );
}

function AttBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs font-semibold text-slate-700 mt-1.5">{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}
