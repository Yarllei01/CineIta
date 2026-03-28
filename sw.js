const CACHE_NAME = 'cineita-v2';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './manifest.json',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/poster-fallback.jpg'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    if (event.request.url.includes('filmes.json')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    }
});