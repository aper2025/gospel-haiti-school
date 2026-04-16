// Gospel Haiti International School — service worker
// Minimal offline-capable shell. Full offline sync for attendance/grades
// is implemented in IndexedDB queues in the client code (see src/lib/offline/*).

const CACHE_VERSION = "v1";
const APP_SHELL = `ghis-app-shell-${CACHE_VERSION}`;
const SHELL_URLS = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== APP_SHELL).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Network-first for HTML and API, cache-first for static assets.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isApi = url.pathname.startsWith("/api/");
  const isHtml = req.headers.get("accept")?.includes("text/html");

  if (isApi || isHtml) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(APP_SHELL).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req))
  );
});
