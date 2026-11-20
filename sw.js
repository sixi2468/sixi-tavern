/* 四夕酒馆 · 离线缓存
   策略：网络优先（保证更新及时），失败时回退到缓存。
   首次访问后，已看过的页面在断网时仍可打开。 */
const CACHE = 'sixi-v1';
const CORE = [
  './', 'index.html', 'shelf.html', 'tavern.html', 'note.html', 'book.html',
  'isbn.html', 'settings.html', 'reading.html', 'about.html', 'privacy.html', 'terms.html',
  'assets/css/main.css', 'assets/js/store.js', 'assets/js/app.js',
  'assets/img/title.png', 'assets/img/seal1.png', 'assets/img/seal2.png',
  'assets/img/bamboo.png', 'assets/img/post.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
  );
});
