"use client";

import { useState, useTransition } from "react";
import { createUserAccount } from "./actions";

type Props = { translations: { save: string; loading: string } };

export function UserManager({ translations: t }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await createUserAccount(formData);
      if (res.error) setResult(`Erreur: ${res.error}`);
      else setResult("Compte créé avec succès");
    });
  }

  return (
    <div>
      {result && (
        <div className={`mb-3 rounded-lg px-4 py-2 text-sm ${
          result.startsWith("Erreur") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
        }`}>
          {result}
        </div>
      )}
      <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">Courriel</label>
          <input type="email" name="email" required placeholder="nom@gospelhaiti.org"
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Mot de passe</label>
          <input type="text" name="password" required minLength={8} placeholder="8+ caractères"
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm w-36" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Rôle</label>
          <select name="role" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
            <option value="HOMEROOM_TEACHER">Titulaire</option>
            <option value="SUBJECT_TEACHER">Enseignant spécialisé</option>
            <option value="ADMIN">Administrateur</option>
            <option value="ASSISTANT">Assistant</option>
            <option value="SUPPORT">Support</option>
          </select>
        </div>
        <button type="submit" disabled={isPending}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {isPending ? t.loading : t.save}
        </button>
      </form>
    </div>
  );
}
