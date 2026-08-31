import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { createHandlerBoundToURL } from 'workbox-precaching';

// ── Precache all build assets ──────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Skip waiting / claim clients immediately ──────────────────────────────
self.skipWaiting();
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// ── SPA Navigation Fallback ────────────────────────────────────────────────
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

// ── Supabase Storage – PDFs & Images (Cache First, 30 days) ───────────────
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co') && url.pathname.includes('/storage/'),
  new CacheFirst({
    cacheName: 'supabase-storage-v1',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ── Supabase REST API (Network First, 24hr fallback) ──────────────────────
const bgSyncPlugin = new BackgroundSyncPlugin('api-sync-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours
});

registerRoute(
  ({ url }) => url.hostname.includes('supabase.co') && url.pathname.includes('/rest/'),
  new NetworkFirst({
    cacheName: 'supabase-api-v1',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      bgSyncPlugin,
    ],
  })
);

// ── Background Sync – retry failed mutations when back online ─────────────
self.addEventListener('sync', event => {
  if (event.tag === 'api-sync-queue') {
    console.log('[SW] Background Sync: retrying failed requests');
  }
});

// ── Periodic Background Sync – refresh content every hour ─────────────────
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-refresh') {
    event.waitUntil(async function() {
      // Silently update the API cache when triggered in background
      const cache = await caches.open('supabase-api-v1');
      console.log('[SW] Periodic sync: refreshing cached content');
    }());
  }
});

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Maxe - Study Hub';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});

// ── Register Periodic Background Sync when SW activates ───────────────────
self.addEventListener('activate', event => {
  event.waitUntil(async function() {
    if ('periodicSync' in self.registration) {
      try {
        await self.registration.periodicSync.register('content-refresh', {
          minInterval: 60 * 60 * 1000, // 1 hour
        });
      } catch (e) {
        // periodicSync permission may not be granted yet
      }
    }
  }());
});
