"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js on mount (browser-only). Silent in dev to avoid
 * interfering with Next.js HMR; opt in via NEXT_PUBLIC_ENABLE_SW_DEV.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const enabledInDev = process.env.NEXT_PUBLIC_ENABLE_SW_DEV === "true";
    if (process.env.NODE_ENV !== "production" && !enabledInDev) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[SW] registration failed:", err);
    });
  }, []);

  return null;
}
