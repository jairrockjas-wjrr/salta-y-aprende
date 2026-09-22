const CACHE = "salta-v9";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// La página se pide a internet primero, para que una versión nueva llegue al
// abrir y no una carga después. El caché queda de respaldo para jugar sin señal.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const esPagina = e.request.mode === "navigate" ||
                   (e.request.destination === "document") ||
                   new URL(e.request.url).pathname.endsWith("/index.html");
  if (esPagina) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
