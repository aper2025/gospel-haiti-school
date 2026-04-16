"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { signIn, type AuthResult } from "./actions";

export function SignInForm({ error }: { error?: string }) {
  const t = useTranslations();

  const [state, formAction, isPending] = useActionState(
    async (_prev: AuthResult, formData: FormData) => {
      return signIn(formData);
    },
    { error },
  );

  return (
    <form action={formAction} className="mt-6 space-y-5">
      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-500 shrink-0" />
          {state.error === "invalid_credentials"
            ? t("auth.invalidCredentials")
            : state.error === "missing_fields"
              ? t("auth.missingFields")
              : t("auth.genericError")}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-slate-700"
        >
          {t("auth.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          placeholder="nom@gospelhaiti.org"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-slate-700"
        >
          {t("auth.password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isPending ? t("common.loading") : t("auth.submit")}
      </button>
    </form>
  );
}
