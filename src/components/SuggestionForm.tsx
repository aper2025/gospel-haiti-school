"use client";

import { useState, useTransition } from "react";
import { MessageSquarePlus, X, Send } from "lucide-react";

export function SuggestionForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: formData.get("authorName"),
          authorEmail: formData.get("authorEmail"),
          category: formData.get("category"),
          body: formData.get("body"),
        }),
      });
      setDone(true);
      setTimeout(() => { setDone(false); setOpen(false); }, 2000);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 transition-colors"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        Suggestions d'amélioration?
      </button>
    );
  }

  if (done) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        Merci pour votre suggestion!
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Suggestion d'amélioration</h3>
          <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form action={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="authorName" placeholder="Nom (optionnel)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400" />
            <input name="authorEmail" type="email" placeholder="Courriel (optionnel)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400" />
          </div>
          <select name="category" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900">
            <option value="feature">Nouvelle fonctionnalité</option>
            <option value="bug">Problème / Bug</option>
            <option value="ui">Interface / Design</option>
            <option value="other">Autre</option>
          </select>
          <textarea name="body" required rows={3} placeholder="Décrivez votre suggestion..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400" />
          <button type="submit" disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Send className="h-3.5 w-3.5" />
            {isPending ? "Envoi..." : "Envoyer"}
          </button>
        </form>
      </div>
    </div>
  );
}
