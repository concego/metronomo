const CACHE_NAME = 'metronomo-v2'; // Mudou para v2!
const arquivosParaSalvar = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './sons/acento.wav',
    './sons/tick.wav',
    './sons/acento1.wav', // Arquivo novo
    './sons/tick1.wav'    // Arquivo novo
];

self.addEventListener('install', (evento) => {
    self.skipWaiting(); // Força a instalação da versão nova
    evento.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(arquivosParaSalvar);
        })
    );
});

// Limpa o cache antigo (v1) quando o v2 entra
self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys().then((nomesDeCache) => {
            return Promise.all(
                nomesDeCache.map((nomeCache) => {
                    if (nomeCache !== CACHE_NAME) {
                        return caches.delete(nomeCache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (evento) => {
    evento.respondWith(
        caches.match(evento.request).then((resposta) => {
            return resposta || fetch(evento.request);
        })
    );
});