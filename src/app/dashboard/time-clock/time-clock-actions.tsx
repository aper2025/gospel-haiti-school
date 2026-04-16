"use client";

import { useTransition } from "react";
import { signIn, signOut } from "./actions";

type Props = {
  hasSignedIn: boolean;
  hasSignedOut: boolean;
  translations: { signIn: string; signOut: string; loading: string };
};

export function TimeClockActions({ hasSignedIn, hasSignedOut, translations: t }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSignIn() {
    startTransition(async () => { await signIn(); });
  }

  function handleSignOut() {
    startTransition(async () => { await signOut(); });
  }

  if (hasSignedOut) {
    return <span className="text-sm text-green-600 font-medium">Journée complète</span>;
  }

  if (hasSignedIn) {
    return (
      <button type="button" onClick={handleSignOut} disabled={isPending}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors">
        {isPending ? t.loading : t.signOut}
      </button>
    );
  }

  return (
    <button type="button" onClick={handleSignIn} disabled={isPending}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
      {isPending ? t.loading : t.signIn}
    </button>
  );
}
