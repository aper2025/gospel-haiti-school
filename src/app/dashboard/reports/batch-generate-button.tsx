"use client";

import { useState, useTransition } from "react";
import { generateClassReportCards } from "./actions";

type Props = {
  classId: string;
  trimestreId: string;
  translations: { generate: string; loading: string };
};

export function BatchGenerateButton({ classId, trimestreId, translations: t }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const res = await generateClassReportCards(classId, trimestreId);
      setResult(`${res.generated}/${res.total} bulletins générés`);
    });
  }

  return (
    <div className="flex items-end gap-2">
      <button type="button" onClick={handleClick} disabled={isPending}
        className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
        {isPending ? t.loading : t.generate}
      </button>
      {result && <span className="text-sm text-green-600">{result}</span>}
    </div>
  );
}
