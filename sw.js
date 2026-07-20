// Service Worker do Pythonlingo
// Estratégia: network-first (tenta sempre buscar a versão mais recente),
// mas se a rede falhar (sem internet, ligação fraca), serve a última versão guardada.
// IMPORTANTE: só trata pedidos do próprio site — nunca intercepta Firebase/Google APIs.

const CACHE_NAME = 'pythonlingo-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch((e) => console.warn('SW: falha ao pré-carregar cache', e))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Só GET, e só pedidos do mesmo site — deixa Firebase/Google/tudo o resto passar direto, sem cache
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(req)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return response;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
