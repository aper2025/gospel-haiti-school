"use client";

import { useState, useTransition } from "react";
import { verifyPinAndGetStaff, saveAttendanceBulk } from "./actions";
import {
  ClipboardCheck, Lock, ChevronLeft, Check, UserCheck,
} from "lucide-react";

type ClassInfo = { id: string; label: string; code: string };
type StudentInfo = { id: string; firstName: string; lastName: string; classId: string };

const CODES = [
  { key: "P", label: "P", full: "Présent", color: "bg-emerald-500 text-white" },
  { key: "L_E", label: "LE", full: "Retard justifié", color: "bg-amber-500 text-white" },
  { key: "L_U", label: "LU", full: "Retard non justifié", color: "bg-orange-500 text-white" },
  { key: "A_E", label: "AE", full: "Absent justifié", color: "bg-red-400 text-white" },
  { key: "A_U", label: "AU", full: "Absent non justifié", color: "bg-red-600 text-white" },
] as const;

type Props = {
  classes: ClassInfo[];
  students: StudentInfo[];
  existingMarks: Record<string, string>;
  classCounts: Record<string, { total: number; marked: number }>;
  date: string;
  dateDisplay: string;
};

type Step = "pin" | "classes" | "marking";

export function TakeAttendanceClient({
  classes, students, existingMarks, classCounts, date, dateDisplay,
}: Props) {
  const [step, setStep] = useState<Step>("pin");
  const [pin, setPin] = useState("");
  const [staffId, setStaffId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [pinError, setPinError] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({ ...existingMarks });
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // PIN verification
  function handlePinSubmit() {
    startTransition(async () => {
      const result = await verifyPinAndGetStaff(pin);
      if (result.error || !result.staff) {
        setPinError(true);
        return;
      }
      setStaffId(result.staff.id);
      setStaffName(`${result.staff.firstName} ${result.staff.lastName}`);
      setStep("classes");
    });
  }

  // Mark a student
  function toggleMark(studentId: string, code: string) {
    setMarks((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === code ? "" : code,
    }));
    setSaved(false);
  }

  // Mark all present for current class
  function markAllPresent() {
    if (!selectedClass) return;
    const classStudents = students.filter((s) => s.classId === selectedClass.id);
    const updated = { ...marks };
    for (const s of classStudents) {
      if (!updated[s.id]) updated[s.id] = "P";
    }
    setMarks(updated);
    setSaved(false);
  }

  // Save
  function handleSave() {
    if (!selectedClass) return;
    const classStudents = students.filter((s) => s.classId === selectedClass.id);
    const classMarks: Record<string, string> = {};
    for (const s of classStudents) {
      if (marks[s.id]) classMarks[s.id] = marks[s.id];
    }

    startTransition(async () => {
      await saveAttendanceBulk(staffId, selectedClass.id, date, classMarks);
      setSaved(true);
    });
  }

  const classStudents = selectedClass
    ? students.filter((s) => s.classId === selectedClass.id)
    : [];

  const classMarkedCount = selectedClass
    ? classStudents.filter((s) => marks[s.id]).length
    : 0;

  // ── PIN SCREEN ──
  if (step === "pin") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-xs text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 mb-6">
            <ClipboardCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Prise de présence</h1>
          <p className="text-sm text-slate-500 mt-1">{dateDisplay}</p>

          <div className="mt-8">
            <div className="flex items-center gap-2 justify-center mb-3">
              <Lock className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Code PIN</span>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setPinError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter" && pin.length === 4) handlePinSubmit(); }}
              className="block w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-3xl tracking-[0.5em] text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="****"
              autoFocus
            />
            {pinError && (
              <p className="mt-2 text-sm text-red-600">Code PIN invalide</p>
            )}
            <button
              type="button"
              onClick={handlePinSubmit}
              disabled={isPending || pin.length !== 4}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 transition-all"
            >
              {isPending ? "..." : "Commencer"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CLASS SELECTION ──
  if (step === "classes") {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-slate-900">Choisir la classe</h1>
          <p className="text-sm text-slate-500 mt-1">{staffName} &middot; {dateDisplay}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {classes.map((cls) => {
            const counts = classCounts[cls.id] ?? { total: 0, marked: 0 };
            // Count from local marks too
            const classStds = students.filter((s) => s.classId === cls.id);
            const localMarked = classStds.filter((s) => marks[s.id]).length;
            const isDone = localMarked >= counts.total && counts.total > 0;

            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => { setSelectedClass(cls); setStep("marking"); }}
                className={`card-hover rounded-2xl border p-5 text-left transition-all ${
                  isDone
                    ? "border-emerald-200 bg-emerald-50"
                    : localMarked > 0
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900">{cls.label}</span>
                  {isDone && <Check className="h-5 w-5 text-emerald-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {localMarked}/{counts.total} marqués
                </p>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isDone ? "bg-emerald-500" : "bg-blue-500"}`}
                    style={{ width: `${counts.total > 0 ? (localMarked / counts.total) * 100 : 0}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── MARKING SCREEN ──
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => setStep("classes")}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">{selectedClass?.label}</h1>
          <p className="text-xs text-slate-500">{classMarkedCount}/{classStudents.length} marqués</p>
        </div>
        <button
          type="button"
          onClick={markAllPresent}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <UserCheck className="h-4 w-4 inline mr-1" />
          Tous P
        </button>
      </div>

      {/* Code legend */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {CODES.map((c) => (
          <span key={c.key} className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold ${c.color}`}>
            {c.label} = {c.full}
          </span>
        ))}
      </div>

      {/* Student list */}
      <div className="space-y-1.5">
        {classStudents.map((s, idx) => {
          const current = marks[s.id] || "";
          return (
            <div
              key={s.id}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                current ? "bg-white border border-slate-200" : "bg-white/60 border border-dashed border-slate-200"
              }`}
            >
              <span className="text-xs text-slate-400 w-5 text-right">{idx + 1}</span>
              <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                {s.lastName}, {s.firstName}
              </span>
              <div className="flex gap-1">
                {CODES.map((c) => {
                  const isActive = current === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => toggleMark(s.id, c.key)}
                      className={`h-9 w-10 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? c.color + " shadow-sm scale-105"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button — sticky bottom */}
      <div className="sticky bottom-0 pt-4 pb-4 mt-4 bg-gradient-to-t from-blue-50 via-blue-50">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || classMarkedCount === 0}
          className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold shadow-lg transition-all ${
            saved
              ? "bg-emerald-500 text-white shadow-emerald-500/25"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/25 hover:shadow-blue-600/40"
          } disabled:opacity-50`}
        >
          {isPending ? "Enregistrement..." : saved ? "Enregistré!" : `Enregistrer (${classMarkedCount}/${classStudents.length})`}
        </button>
      </div>
    </div>
  );
}
