// NOTE: https://stackoverflow.com/questions/41009167/what-is-the-use-of-self-clients-claim
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', function (event) {
  if (event.data) {
    const { title, body, icon, badge, tag, data, notificationId } = event.data.json()

    const options = {
      body,
      icon: icon || '/icon.png',
      badge: badge || '/badge.png',
      vibrate: [100, 50, 100],
      tag: tag || 'default',
      requireInteraction: false,
      renotify: true,
      silent: false,
      data: {
        ...data,
        notificationId,
        dateOfArrival: Date.now(),
      },
      actions: [
        {
          action: 'view',
          title: '보기',
          icon: '/icon-view.png',
        },
        {
          action: 'dismiss',
          title: '닫기',
          icon: '/icon-close.png',
        },
      ],
    }

    event.waitUntil(self.registration.showNotification(title, options))
  }
})

self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received:', event.action)
  event.notification.close()

  const notificationData = event.notification.data
  let targetUrl = 'https://litomi.in'

  if (event.action === 'view' && notificationData?.url) {
    targetUrl = `https://litomi.in${notificationData.url}`
  } else if (notificationData?.url) {
    targetUrl = `https://litomi.in${notificationData.url}`
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.startsWith('https://litomi.in') && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    }),
  )
})
