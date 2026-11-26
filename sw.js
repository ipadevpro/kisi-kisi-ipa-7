/* Service worker Jejak IPA 7: membuat aplikasi tetap jalan tanpa internet.
   - File aplikasi (HTML/JS/CSS/config): ambil dari jaringan dulu supaya selalu terbaru,
     pakai salinan cache bila offline atau jaringan lambat (> 4 detik).
   - Font, ikon, library: ambil dari cache dulu.
   - Permintaan ke Google Apps Script (kirim nilai) tidak disentuh.
   Naikkan VERSION bila menambah atau mengganti nama file di daftar ASSETS. */
const VERSION = 'v1';
const CACHE = 'jejak-ipa7-' + VERSION;
const ASSETS = [
  './', 'index.html', 'config.js', 'manifest.webmanifest',
  'assets/style.css', 'assets/figures.js', 'assets/kisi.js', 'assets/data.js', 'assets/app.js',
  'assets/fonts/nunito-latin.woff2', 'assets/vendor/confetti.browser.min.js',
  'assets/icons/favicon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('jejak-ipa7-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const STATIC = /\/assets\/(fonts|icons|vendor)\//;
function networkFirst(req) {
  return new Promise(resolve => {
    let done = false;
    const fallback = () => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
    const timer = setTimeout(() => { fallback().then(r => { if (r && !done) { done = true; resolve(r); } }); }, 4000);
    fetch(req).then(res => {
      clearTimeout(timer);
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      if (!done) { done = true; resolve(res); }
    }).catch(() => {
      clearTimeout(timer);
      fallback().then(r => { if (!done) { done = true; resolve(r || Response.error()); } });
    });
  });
}
function cacheFirst(req) {
  return caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }));
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(STATIC.test(url.pathname) ? cacheFirst(req) : networkFirst(req));
});
