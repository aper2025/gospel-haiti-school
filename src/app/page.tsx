import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";

export default async function Home() {
  const t = await getTranslations();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-200 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-200 blur-3xl" />
      </div>
      <div className="relative max-w-lg w-full text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-600/30 mb-8">
          <GraduationCap className="h-10 w-10 text-white" />
        </div>
        <p className="text-xs font-bold tracking-[0.25em] text-blue-600 uppercase">
          {t("app.shortName")}
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900">
          {t("app.name")}
        </h1>
        <p className="mt-3 text-lg text-slate-600">{t("app.tagline")}</p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            {t("auth.signIn")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/staff-clock"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow transition-all duration-200"
          >
            Pointage personnel
          </Link>
        </div>

        <p className="mt-12 text-xs text-slate-400">
          Oriani, Ouest, Haïti &middot; portal.gospelhaiti.org
        </p>
      </div>
    </main>
  );
}
