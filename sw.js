// Пульт без облака «Tacto · без облака» (движок пульта-сценария Robby): страница и записи живут в телефоне — пульт открывается и играет без интернета (14.11.2026).
// Страница: сначала сеть (до 3 с, чтобы правки доезжали), иначе — сохранённая копия.
// Записи: сначала из телефона (в адресе хеш текста ?h=…, новая озвучка = новый адрес), иначе из сети с сохранением.
const KESH = 'tacto-offline-v1';   // своё хранилище: домен у всех пультов общий, чужие не трогаем
const STRANICA = new URL('./', self.registration.scope).href;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('tacto-offline-') && k !== KESH) await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || !r.url.startsWith(self.registration.scope)) return;
  if (u.pathname.includes('/audio/')) {
    e.respondWith((async () => {
      const c = await caches.open(KESH);
      const est = await c.match(r.url);
      if (est) return est;
      const otv = await fetch(r.url);
      if (otv.ok) await c.put(r.url, otv.clone());
      return otv;
    })());
    return;
  }
  if (r.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(KESH);
      try {
        const otv = await Promise.race([fetch(r), new Promise((_, nein) => setTimeout(() => nein(new Error('медленно')), 3000))]);
        if (otv.ok) await c.put(STRANICA, otv.clone());
        return otv;
      } catch (err) {
        const est = await c.match(STRANICA);
        if (est) return est;
        return fetch(r);
      }
    })());
  }
});
