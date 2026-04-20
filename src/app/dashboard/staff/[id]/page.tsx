import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ObservationForm } from "./observation-form";

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("DIRECTOR", "ADMIN");
  const t = await getTranslations();
  const { id } = await params;

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { class: { select: { label: true } } },
      },
      observationsReceived: {
        include: { observer: { select: { firstName: true, lastName: true } } },
        orderBy: { date: "desc" },
        take: 10,
      },
      leaveRequests: {
        orderBy: { startDate: "desc" },
        take: 10,
      },
    },
  });

  if (!staff) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{t(`roles.${staff.role}`)}</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {staff.firstName} {staff.lastName}
          </h1>
          {staff.email && <p className="text-sm text-slate-500">{staff.email}</p>}
        </div>
        <Link
          href={`/dashboard/staff/${id}/edit`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Modifier
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Informations">
          <Row label="Genre" value={staff.gender ?? "—"} />
          <Row label="Téléphone" value={staff.phone ?? "—"} />
          <Row label="Date de début" value={staff.startDate?.toLocaleDateString("fr-FR", { timeZone: "UTC" }) ?? "—"} />
          <Row label="Contrat" value={staff.contractType ?? "—"} />
          <Row label="Code PIN" value={staff.staffPin ?? "—"} />
          <Row label="Performance" value={t(`staff.performance.${staff.performanceStatus}`)} />
        </Card>

        <Card title="Affectations">
          {staff.assignments.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune affectation</p>
          ) : (
            staff.assignments.map((a) => (
              <div key={a.id} className="flex justify-between py-1 text-sm">
                <span className="text-slate-600">{a.class.label}</span>
                <span className="font-medium text-slate-900">
                  {a.isHomeroom ? "Titulaire" : a.subject ?? ""}
                </span>
              </div>
            ))
          )}
        </Card>

        <Card title="Contact d'urgence">
          <Row label="Nom" value={staff.emergencyContactName ?? "—"} />
          <Row label="Téléphone" value={staff.emergencyContactPhone ?? "—"} />
        </Card>

        <Card title="Adresse">
          <Row label="Village" value={staff.addressVillage ?? "—"} />
          <Row label="Commune" value={staff.addressCommune ?? "—"} />
          <Row label="Département" value={staff.addressDepartment ?? "—"} />
        </Card>

        {/* Observations */}
        <Card title={t("staff.observations")} className="lg:col-span-2">
          <ObservationForm
            staffId={id}
            translations={{ save: t("common.save"), loading: t("common.loading") }}
          />
          {staff.observationsReceived.length > 0 && (
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              {staff.observationsReceived.map((obs) => (
                <div key={obs.id} className="text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-700">
                      {obs.observer.firstName} {obs.observer.lastName}
                    </span>
                    <span className="text-xs text-slate-500">{obs.date.toLocaleDateString("fr-FR", { timeZone: "UTC" })}</span>
                  </div>
                  {obs.score != null && <p className="text-slate-500">Score: {obs.score}</p>}
                  {obs.strengths && <p className="text-green-700">{obs.strengths}</p>}
                  {obs.improvements && <p className="text-amber-700">{obs.improvements}</p>}
                  {obs.actionPlan && <p className="text-slate-600">Plan: {obs.actionPlan}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Leave history */}
        <Card title={t("staff.leave")} className="lg:col-span-2">
          {staff.leaveRequests.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun congé</p>
          ) : (
            <div className="space-y-2">
              {staff.leaveRequests.map((lr) => (
                <div key={lr.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-slate-700">{lr.type}</span>
                    <span className="text-slate-500 ml-2">
                      {lr.startDate.toLocaleDateString("fr-FR", { timeZone: "UTC" })} — {lr.endDate.toLocaleDateString("fr-FR", { timeZone: "UTC" })}
                    </span>
                  </div>
                  <LeaveStatusBadge status={lr.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <Link href="/dashboard/staff" className="text-sm text-blue-700 hover:text-blue-900">
          &larr; Retour
        </Link>
      </div>
    </div>
  );
}

function Card({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
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

function LeaveStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    APPROVED: "bg-green-50 text-green-700",
    DENIED: "bg-red-50 text-red-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}
