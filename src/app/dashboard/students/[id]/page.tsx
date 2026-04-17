import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { BehaviorLevelEditor } from "./behavior-level-editor";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      currentClass: true,
      enrollments: {
        include: { year: true, class: true },
        orderBy: { year: { startDate: "desc" } },
      },
      retentionRecords: { orderBy: { createdAt: "desc" } },
      siblingsOf: { include: { studentB: { select: { id: true, firstName: true, lastName: true } } } },
      siblingOf: { include: { studentA: { select: { id: true, firstName: true, lastName: true } } } },
      behaviorChanges: { orderBy: { changedAt: "desc" }, take: 10 },
    },
  });

  if (!student) notFound();

  const canEdit = hasRole(user, "DIRECTOR", "ADMIN");

  // Combine siblings from both directions
  const siblings = [
    ...student.siblingsOf.map((l) => l.studentB),
    ...student.siblingOf.map((l) => l.studentA),
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {student.currentClass?.label ?? "Aucune classe"} &middot;{" "}
            <StatusText status={student.enrollmentStatus} />
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {student.firstName} {student.lastName}
          </h1>
          {student.schoolEmail && (
            <p className="text-sm text-slate-500">{student.schoolEmail}</p>
          )}
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link
              href={`/dashboard/students/${id}/edit`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Modifier
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal info */}
        <Card title="Identité">
          <Row label="Genre" value={student.gender ?? "—"} />
          <Row
            label="Date de naissance"
            value={student.dateOfBirth ? student.dateOfBirth.toLocaleDateString("fr-FR") : "—"}
          />
          <Row label="Acte de naissance" value={student.birthCertOnFile ? "Oui" : "Non"} />
        </Card>

        {/* Address */}
        <Card title="Adresse">
          <Row label="Village" value={student.addressVillage ?? "—"} />
          <Row label="Quartier" value={student.addressNeighborhood ?? "—"} />
          <Row label="Commune" value={student.addressCommune ?? "—"} />
          <Row label="Département" value={student.addressDepartment ?? "—"} />
        </Card>

        {/* Mother */}
        <Card title="Mère">
          <Row
            label="Nom"
            value={
              student.motherFirstName || student.motherLastName
                ? `${student.motherFirstName ?? ""} ${student.motherLastName ?? ""}`.trim()
                : "—"
            }
          />
          <Row label="Vivante" value={student.motherAlive ?? "—"} />
          <Row label="Téléphone" value={student.motherPhone ?? "—"} />
        </Card>

        {/* Father */}
        <Card title="Père">
          <Row
            label="Nom"
            value={
              student.fatherFirstName || student.fatherLastName
                ? `${student.fatherFirstName ?? ""} ${student.fatherLastName ?? ""}`.trim()
                : "—"
            }
          />
          <Row label="Vivant" value={student.fatherAlive ?? "—"} />
          <Row label="Téléphone" value={student.fatherPhone ?? "—"} />
        </Card>

        {/* Emergency contact */}
        <Card title="Contact d'urgence">
          <Row label="Nom" value={student.emergencyContactName ?? "—"} />
          <Row label="Téléphone" value={student.emergencyContactPhone ?? "—"} />
        </Card>

        {/* Behavior */}
        <Card title="Comportement">
          <BehaviorLevelEditor
            studentId={student.id}
            currentLevel={student.currentBehaviorLevel}
          />
          {student.behaviorChanges.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Historique</p>
              {student.behaviorChanges.map((ch) => (
                <div key={ch.id} className="flex items-center justify-between py-1.5 text-sm border-b border-slate-50 last:border-0">
                  <div>
                    <span className="text-slate-500">{ch.fromLevel}</span>
                    <span className="text-slate-400 mx-1.5">&rarr;</span>
                    <span className="font-medium text-slate-900">{ch.toLevel}</span>
                    {ch.reason && <p className="text-xs text-slate-500 mt-0.5">{ch.reason}</p>}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 ml-2">
                    {ch.changedAt.toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Siblings */}
        {siblings.length > 0 && (
          <Card title="Fratrie à l'école">
            {siblings.map((s) => (
              <div key={s.id} className="py-1">
                <Link href={`/dashboard/students/${s.id}`} className="text-sm text-blue-700 hover:text-blue-900">
                  {s.firstName} {s.lastName}
                </Link>
              </div>
            ))}
          </Card>
        )}

        {/* Enrollment history */}
        {student.enrollments.length > 0 && (
          <Card title="Historique des inscriptions">
            {student.enrollments.map((e) => (
              <div key={e.id} className="flex justify-between py-1 text-sm">
                <span className="text-slate-600">{e.year.label}</span>
                <span className="font-medium text-slate-900">
                  {e.class.label}
                  {e.retained && (
                    <span className="ml-2 text-xs text-amber-600">(redoublant)</span>
                  )}
                </span>
              </div>
            ))}
          </Card>
        )}

        {/* Retention records */}
        {student.retentionRecords.length > 0 && (
          <Card title="Redoublements">
            {student.retentionRecords.map((r) => (
              <div key={r.id} className="py-1 text-sm">
                <span className="font-medium">{r.yearLabel}</span> — {r.classCode}
                {r.reason && <p className="text-slate-500 mt-0.5">{r.reason}</p>}
              </div>
            ))}
          </Card>
        )}

        {/* Notes */}
        {(student.medicalNotes || student.generalNotes) && (
          <Card title="Notes" className="lg:col-span-2">
            {student.medicalNotes && (
              <div className="mb-3">
                <p className="text-xs font-medium text-slate-500 uppercase">Médicales</p>
                <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{student.medicalNotes}</p>
              </div>
            )}
            {student.generalNotes && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Générales</p>
                <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{student.generalNotes}</p>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Back link */}
      <div className="mt-8">
        <Link
          href="/dashboard/students"
          className="text-sm text-blue-700 hover:text-blue-900"
        >
          &larr; Retour à la liste
        </Link>
      </div>
    </div>
  );
}

function Card({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className ?? ""}`}>
      <h2 className="text-sm font-semibold text-slate-700 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-slate-50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function StatusText({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "Actif",
    WITHDRAWN: "Retiré",
    GRADUATED: "Diplômé",
  };
  return <span>{map[status] ?? status}</span>;
}

function behaviorLabel(level: string): string {
  const map: Record<string, string> = {
    L0: "Niveau 0 — Aucun problème",
    L1: "Niveau 1",
    L2: "Niveau 2",
    L3: "Niveau 3",
    L4: "Niveau 4",
    L5: "Niveau 5",
    L6: "Niveau 6",
  };
  return map[level] ?? level;
}
