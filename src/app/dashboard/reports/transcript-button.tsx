"use client";

import { useState, useTransition } from "react";
import { generateTranscript } from "./actions";

type Props = {
  studentId: string;
  translations: { generate: string; loading: string };
};

export function TranscriptButton({ studentId, translations: t }: Props) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleClick() {
    startTransition(async () => {
      await generateTranscript(studentId);
      setDone(true);
    });
  }

  if (done) return <span className="text-xs text-green-600">Généré</span>;

  return (
    <button type="button" onClick={handleClick} disabled={isPending}
      className="text-sm text-blue-700 hover:text-blue-900 disabled:opacity-50">
      {isPending ? t.loading : t.generate}
    </button>
  );
}
