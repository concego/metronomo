const CACHE_NAME = 'metronomo-v1';
const arquivosParaSalvar = [
    './',
    './index.html',
    './app.js',
    './sons/acento.wav',
    './sons/tick.wav',
    './manifest.json'
];

// Salva os arquivos no celular quando o app é aberto a primeira vez
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(arquivosParaSalvar);
        })
    );
});

// Faz o app carregar os arquivos salvos em vez de pedir da internet
self.addEventListener('fetch', (evento) => {
    evento.respondWith(
        caches.match(evento.request).then((resposta) => {
            return resposta || fetch(evento.request);
        })
    );
});