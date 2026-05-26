/**
 * favimaker service worker — cache-first для статики + index, network-fallback.
 *
 * Стратегия: на install прекэшируем shell (HTML root + manifest + svg). На
 * fetch отдаём из кеша если есть, иначе сеть; успешный сетевой ответ
 * (одинакового origin, GET) кэшируем фоном на будущее.
 *
 * Версия кеша — bump'ить при breaking changes сборки (например, новый
 * хеш чанков делает старые ненужными). Простой semantic counter.
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = `favimaker-${CACHE_VERSION}`;
const SHELL = ["/", "/favicon.svg", "/site.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Чистим старые версии кеша
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Кэшируем только same-origin. Google Fonts CSS из fonts.googleapis.com
  // намеренно не кэшируем — браузер сам управляет HTTP-cache там.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Background revalidate — не блокируем ответ
        fetch(req)
          .then((res) => {
            if (res && res.ok) {
              caches.open(CACHE_NAME).then((c) => c.put(req, res.clone()));
            }
          })
          .catch(() => {});
        return cached;
      }
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match("/"));
    }),
  );
});
