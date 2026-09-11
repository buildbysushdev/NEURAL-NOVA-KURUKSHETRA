// Kurukshetra PS20: Emergency Disaster Mesh Service Worker
const CACHE_NAME = "kurukshetra-offline-v1";
const OFFLINE_URLS = [
  "/",
  "/dashboard/citizen",
  "/dashboard/rescue",
  "/dashboard/authority",
  "/manifest.json"
];

// Pre-cache emergency assets and offline shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline emergency shell");
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn("[Service Worker] Cache prefetch non-fatal:", err);
      });
    })
  );
  self.skipWaiting();
});

// Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first strategy with offline cache fallback
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Let browser handle cross-origin or chrome-extension
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        console.log("[Service Worker] Network failed, serving cached fallback for:", event.request.url);
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        // If asking for a page navigation, return the cached citizen dashboard
        if (event.request.mode === "navigate") {
          const fallbackPage = await caches.match("/dashboard/citizen");
          if (fallbackPage) return fallbackPage;
        }

        return new Response("Offline - Local Mesh Active", {
          status: 503,
          statusText: "Offline Mesh Active",
          headers: new Headers({ "Content-Type": "text/plain" })
        });
      })
  );
});
