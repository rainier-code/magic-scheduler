
import { precacheAndRoute } from 'workbox-precaching';

// Required by Workbox to inject the PWA asset list.
precacheAndRoute(self.__WB_MANIFEST);

// Handle incoming push notifications.
self.addEventListener('push', (event) => {
  const payload = (() => {
    try {
      return event.data ? event.data.json() : {};
    } catch {
      return {
        body: event.data ? event.data.text() : ''
      };
    }
  })();

  const title = payload.title || 'Magic Scheduler';

  const options = {
    body: payload.body || 'You have a new notification.',
    icon: '/icon-192.png',
    badge: '/favicon-64.png',
    data: {
      url: payload.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationUrl = new URL(
    event.notification.data?.url || '/',
    self.location.origin
  );

  // Only allow URLs within this application.
  if (notificationUrl.origin !== self.location.origin) {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }

      return self.clients.openWindow(notificationUrl.href);
    })
  );
});
