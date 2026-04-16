"use client";

import { useTransition } from "react";

export function LanguageToggle() {
  const [isPending, startTransition] = useTransition();

  function setLocale(locale: string) {
    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
      window.location.reload();
    });
  }

  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => setLocale("fr")}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
        Français
      </button>
      <button type="button" onClick={() => setLocale("en")}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
        English
      </button>
    </div>
  );
}
