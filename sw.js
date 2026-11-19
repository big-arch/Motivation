'use strict';

const CACHE = 'founder-shell-dev';
const ROOT = new URL('./', self.location.href);
const indexUrl = new URL('index.html', ROOT).href;
const photos = ['fitz-roy','nike','kodak','habits','apple','dodo','wework'];
const fontFiles = ['inter-cyrillic-wght-normal','inter-latin-wght-normal',
  'playfair-display-latin-wght-normal','playfair-display-latin-wght-italic',
  'playfair-display-cyrillic-wght-normal','playfair-display-cyrillic-wght-italic'];
const assets = [
  'index.html','css/style.css','css/edition.css','js/app.js','js/content.js','js/edition.js','js/photos.js','js/media.js','js/cards.js','js/motion.js','manifest.json','data/news.json','data/videos.json',
  ...photos.flatMap(name => ['-sm',''].map(size => 'assets/photos/' + name + size + '.webp')),
  ...fontFiles.map(name => 'assets/fonts/' + name + '.woff2'),
  ...[180,192,512].map(size => 'assets/icons/icon-' + size + '.png')
].map(path => new URL(path, ROOT).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(assets.map(url => new Request(url,{cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('founder-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  if (request.mode === 'navigate' && (url.pathname === ROOT.pathname || url.href.split('?')[0] === indexUrl)) {
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
  } else if (url.pathname.startsWith(ROOT.pathname + 'assets/archive/') && url.pathname.endsWith('.webp')) {
    event.respondWith(caches.open(CACHE).then(async cache => {
      const saved = await cache.match(request);
      if (saved) return saved;
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request,response.clone());
        return response;
      } catch { return Response.error(); }
    }));
  } else if (assets.includes(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request)));
  }
});
self.addEventListener('message',event => {
  const id = event.data?.article;
  if (typeof id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(id)) return;
  const urls = ['1','2','card'].map(part=>new URL('assets/archive/'+id+'-'+part+'.webp',ROOT).href);
  event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(urls.map(async url=>{
    if (!(await cache.match(url))) await cache.add(url);
  }))));
});
