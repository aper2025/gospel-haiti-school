import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { FeeScheduleForm } from "./fee-schedule-form";
import { FeeFilters } from "./fee-filters";
import { PaymentDialog } from "./payment-dialog";

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; status?: string }>;
}) {
  await requireRole("DIRECTOR", "ADMIN");
  const t = await getTranslations();
  const params = await searchParams;

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeYear) {
    return <p className="text-slate-500">Aucune année scolaire active.</p>;
  }

  const classes = await prisma.class.findMany({
    where: { excluded: false },
    orderBy: { orderIdx: "asc" },
    select: { id: true, label: true },
  });

  // Fee schedules
  const schedules = await prisma.feeSchedule.findMany({
    where: { yearId: activeYear.id },
    include: { class: { select: { label: true } } },
    orderBy: { class: { orderIdx: "asc" } },
  });

  // Accounts with filters
  const accountWhere: Record<string, unknown> = { yearId: activeYear.id };
  if (params.status) accountWhere.status = params.status;

  const accounts = await prisma.feeAccount.findMany({
    where: {
      ...accountWhere,
      ...(params.class ? { student: { currentClassId: params.class } } : {}),
    },
    include: {
      student: {
        select: { firstName: true, lastName: true, currentClass: { select: { label: true } } },
      },
    },
    orderBy: { student: { lastName: "asc" } },
  });

  // Summary stats
  const totalOwed = accounts.reduce((s, a) => s + Number(a.totalOwed), 0);
  const totalPaid = accounts.reduce((s, a) => s + Number(a.totalPaid), 0);
  const overdue = accounts.filter((a) => a.status === "OVERDUE" || a.status === "UNPAID").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{t("nav.fees")}</h1>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total dû" value={formatHTG(totalOwed)} />
        <SummaryCard label="Total perçu" value={formatHTG(totalPaid)} />
        <SummaryCard
          label="Impayés / En retard"
          value={String(overdue)}
          alert={overdue > 0}
        />
      </div>

      {/* Fee schedule management */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          {t("fees.schedule")} — {activeYear.label}
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            {schedules.map((s) => (
              <div key={s.id} className="flex justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span className="text-slate-700">{s.class.label}</span>
                <span className="font-medium text-slate-900">
                  {formatHTG(Number(s.amountHtg))}
                </span>
              </div>
            ))}
          </div>
          <FeeScheduleForm
            classes={classes}
            translations={{ save: t("common.save"), loading: t("common.loading") }}
          />
        </div>
      </div>

      {/* Accounts list */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Comptes élèves ({accounts.length})
          </h2>
          <FeeFilters classes={classes} currentClass={params.class} currentStatus={params.status} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Élève</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 hidden sm:table-cell">Classe</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Dû</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Payé</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Solde</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                    {t("common.noData")}
                  </td>
                </tr>
              ) : (
                accounts.map((a) => {
                  const balance = Number(a.totalOwed) - Number(a.totalPaid);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {a.student.lastName}, {a.student.firstName}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                        {a.student.currentClass?.label ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">
                        {formatHTG(Number(a.totalOwed))}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">
                        {formatHTG(Number(a.totalPaid))}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right">
                        <span className={balance > 0 ? "text-red-600" : "text-green-600"}>
                          {formatHTG(balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <PaymentStatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <PaymentDialog
                          accountId={a.id}
                          studentName={`${a.student.lastName}, ${a.student.firstName}`}
                          translations={{
                            save: t("common.save"),
                            cancel: t("common.cancel"),
                            loading: t("common.loading"),
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${alert ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${alert ? "text-red-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID_IN_FULL: "bg-green-50 text-green-700 border-green-200",
    PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
    UNPAID: "bg-red-50 text-red-700 border-red-200",
    OVERDUE: "bg-red-100 text-red-800 border-red-300",
  };
  const labels: Record<string, string> = {
    PAID_IN_FULL: "Payé",
    PARTIAL: "Partiel",
    UNPAID: "Impayé",
    OVERDUE: "En retard",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}


function formatHTG(amount: number): string {
  return new Intl.NumberFormat("fr-HT", {
    style: "currency",
    currency: "HTG",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
