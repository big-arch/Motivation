'use strict';

const CACHE = 'founder-shell-dev';
const ROOT = new URL('./', self.location.href);
const indexUrl = new URL('index.html', ROOT).href;
const photos = ['fitz-roy','nike','kodak','habits','apple','dodo','wework'];
const fontFiles = ['inter-cyrillic-wght-normal','inter-latin-wght-normal',
  'playfair-display-latin-wght-normal','playfair-display-latin-wght-italic',
  'playfair-display-cyrillic-wght-normal','playfair-display-cyrillic-wght-italic'];
const assets = [
  'index.html','css/style.css','js/app.js','js/content.js','manifest.json','data/news.json','data/videos.json',
  ...photos.flatMap(name => ['-sm',''].map(size => 'assets/photos/' + name + size + '.webp')),
  ...fontFiles.map(name => 'assets/fonts/' + name + '.woff2'),
  ...[180,192,512].map(size => 'assets/icons/icon-' + size + '.png')
].map(path => new URL(path, ROOT).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(assets)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('founder-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(indexUrl)) || fetch(request)));
  } else if (url.pathname === ROOT.pathname + 'data/news.json' || url.pathname === ROOT.pathname + 'data/videos.json') {
    event.respondWith(caches.open(CACHE).then(async cache => {
      try {
        const response = await fetch(request, {cache:'no-cache'});
        if (!response.ok) throw new Error('Feed unavailable');
        await cache.put(request, response.clone());
        return response;
      } catch {
        return (await cache.match(request)) || Response.error();
      }
    }));
  } else if (assets.includes(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request)));
  }
});
