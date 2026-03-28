// ManuFlow Service Worker v4 - Kill switch + Clean fetch
// Limpa TODOS os caches antigos e nunca cacheia dados de API

const CACHE_VERSION = 'manuflow-v4';

self.addEventListener('install', (event) => {
  console.log('[SW v4] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW v4] Activating - clearing all old caches...');
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => {
        console.log('[SW v4] Deleting caches:', keys);
        return Promise.all(keys.map((key) => caches.delete(key)));
      }),
      self.clients.claim(),
    ]).then(() => {
      console.log('[SW v4] All old caches cleared. Ready.');
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // APIs: NUNCA cacheia, vai sempre direto a rede com credentials
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request, { credentials: 'include' })
        .catch(() => {
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // Arquivos estaticos Next.js: cacheia (nunca mudam com hash)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Todo o resto: rede direta
  event.respondWith(fetch(event.request, { credentials: 'same-origin' }));
});
