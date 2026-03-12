// Service worker for PWA share target support

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle share target GET requests to /save
  if (url.pathname === "/save" && url.searchParams.has("url")) {
    event.respondWith(Response.redirect(url.href, 303));
    return;
  }

  // Pass through all other requests
  event.respondWith(fetch(event.request));
});
