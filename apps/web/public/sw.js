const CACHE_VERSION = '20260531'

const CACHE_NAMES = {
  STATIC: `static-cache-${CACHE_VERSION}`,
  DYNAMIC: `dynamic-cache-${CACHE_VERSION}`,
  IMAGES: `image-cache-${CACHE_VERSION}`,
  API: `api-cache-${CACHE_VERSION}`,
}

const PWA_CRITICAL_APP_SHELLS = [
  '/',
  '/manifest.webmanifest',
  '/web-app-manifest-144x144.png',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
]

// NOTE: https://stackoverflow.com/questions/41009167/what-is-the-use-of-self-clients-claim
self.addEventListener('install', async (event) => {
  const cache = await caches.open(CACHE_NAMES.STATIC)

  async function cacheAsset(url) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return cache.put(url, response)
      }
    } catch {
      return null
    }
  }

  const requests = PWA_CRITICAL_APP_SHELLS.map((url) => cacheAsset(url))
  await Promise.all(requests)
  event.waitUntil(self.skipWaiting())
})

// NOTE: 활성화 시 기존 캐시 삭제
self.addEventListener('activate', async (event) => {
  const cacheNames = await caches.keys()

  const filteredCacheNames = cacheNames
    .filter((cacheName) => !Object.values(CACHE_NAMES).includes(cacheName))
    .map((cacheName) => caches.delete(cacheName))

  await Promise.all(filteredCacheNames)
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  const { title, body, icon, badge, tag, data } = event.data.json()

  const options = {
    body,
    icon: icon || '/icon.png',
    badge: badge || '/badge.png',
    vibrate: [200, 100, 200],
    tag: tag || 'default',
    data,
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

  async function showNotificationIfInvisible() {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const isVisible = clientList.some((client) => client.visibilityState === 'visible' && client.focused)

    if (isVisible) {
      // 사용자가 이미 앱을 보고 있는 상태라면 시스템 알림을 띄우지 않습니다.
      return
    }

    return self.registration.showNotification(title, options)
  }

  event.waitUntil(showNotificationIfInvisible())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const notificationData = event.notification.data
  const targetURL = getSafeTargetURL(notificationData?.url)

  async function openOrFocusWindow() {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

    for (const client of clientList) {
      const isAlreadyOpen = isSameOriginClient(client) && 'focus' in client

      if (isAlreadyOpen) {
        await client.navigate(targetURL)
        return client.focus()
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(targetURL)
    }
  }

  event.waitUntil(openOrFocusWindow())
})

function getSafeTargetURL(url) {
  const fallbackURL = self.location.origin

  if (!url) {
    return fallbackURL
  }

  try {
    const parsedURL = new URL(url, fallbackURL)
    return parsedURL.origin === self.location.origin ? parsedURL.toString() : fallbackURL
  } catch {
    return fallbackURL
  }
}

function isSameOriginClient(client) {
  try {
    return new URL(client.url).origin === self.location.origin
  } catch {
    return false
  }
}
