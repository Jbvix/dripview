// Custom service worker — Workbox handles cache via vite-plugin-pwa
// This file is kept minimal; Workbox injects its own precache manifest at build time

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
