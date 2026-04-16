import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function Home() {
  const t = await getTranslations();

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-10">
        <p className="text-xs font-medium tracking-widest text-blue-900 uppercase">
          {t("app.shortName")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-900">
          {t("app.name")}
        </h1>
        <p className="mt-2 text-slate-600">{t("app.tagline")}</p>

        <div className="mt-8 flex gap-3">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
          >
            {t("auth.signIn")}
          </Link>
          <Link
            href="/api/health"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Health check
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-500">
          Oriani, Ouest, Haïti · portal.gospelhaiti.org
        </p>
      </div>
    </main>
  );
}
