import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { StudentFilters } from "./student-filters";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; status?: string; q?: string }>;
}) {
  const user = await requireAuth();
  const t = await getTranslations();
  const params = await searchParams;

  const classes = await prisma.class.findMany({
    where: { excluded: false },
    orderBy: { orderIdx: "asc" },
  });

  const where: Record<string, unknown> = {};

  if (params.class) {
    where.currentClassId = params.class;
  }
  if (params.status) {
    where.enrollmentStatus = params.status;
  }
  if (params.q) {
    where.OR = [
      { firstName: { contains: params.q, mode: "insensitive" } },
      { lastName: { contains: params.q, mode: "insensitive" } },
      { schoolEmail: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const students = await prisma.student.findMany({
    where,
    include: { currentClass: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const canCreate = hasRole(user, "DIRECTOR", "ADMIN");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t("nav.students")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {students.length} {students.length === 1 ? "élève" : "élèves"}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/students/new"
            className="rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
          >
            + {t("common.add")}
          </Link>
        )}
      </div>

      <StudentFilters
        classes={classes.map((c) => ({ id: c.id, label: c.label }))}
        current={{ class: params.class, status: params.status, q: params.q }}
        translations={{
          search: t("common.search"),
          allClasses: "Toutes les classes",
          allStatuses: "Tous les statuts",
          active: "Actif",
          withdrawn: "Retiré",
          graduated: "Diplômé",
        }}
      />

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Nom
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 hidden sm:table-cell">
                Classe
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 hidden md:table-cell">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 hidden lg:table-cell">
                Genre
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  {t("common.noData")}
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/students/${s.id}`}
                      className="font-medium text-slate-900 hover:text-blue-700"
                    >
                      {s.lastName}, {s.firstName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                    {s.currentClass?.label ?? "—"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <StatusBadge status={s.enrollmentStatus} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">
                    {s.gender ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/students/${s.id}`}
                      className="text-sm text-blue-700 hover:text-blue-900"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-50 text-green-700 border-green-200",
    WITHDRAWN: "bg-amber-50 text-amber-700 border-amber-200",
    GRADUATED: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const labels: Record<string, string> = {
    ACTIVE: "Actif",
    WITHDRAWN: "Retiré",
    GRADUATED: "Diplômé",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
