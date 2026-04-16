"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem("pwa-install-dismissed")) {
      setDismissed(true);
    }

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-lg sm:left-auto sm:right-4">
      <p className="text-sm font-medium text-blue-900">
        Installer l'application GHIS
      </p>
      <p className="mt-1 text-xs text-blue-700">
        Accès rapide depuis votre écran d'accueil, même hors ligne.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 transition-colors"
        >
          Installer
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-lg border border-blue-300 px-4 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
