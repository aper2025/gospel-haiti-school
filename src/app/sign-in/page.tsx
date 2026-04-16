import { getTranslations } from "next-intl/server";
import { GraduationCap } from "lucide-react";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const t = await getTranslations();
  const params = await searchParams;

  return (
    <main className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-indigo-400 blur-3xl" />
        </div>
        <div className="relative text-center max-w-md">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm mb-8">
            <GraduationCap className="h-10 w-10 text-blue-300" />
          </div>
          <h2 className="text-3xl font-bold text-white">
            {t("app.name")}
          </h2>
          <p className="mt-3 text-blue-200">
            {t("app.tagline")}
          </p>
          <p className="mt-8 text-sm text-blue-300/60">
            Oriani, Ouest, Haïti
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30 mb-4">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {t("app.shortName")}
            </h1>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200/80">
            <h1 className="text-xl font-bold text-slate-900">
              {t("auth.signIn")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("app.name")}
            </p>
            <SignInForm error={params.error} />
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            portal.gospelhaiti.org
          </p>
        </div>
      </div>
    </main>
  );
}
