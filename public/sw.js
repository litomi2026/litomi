// self.addEventListener('fetch', (event) => {
//   const url = event.request.url
//   const prefix = `${location.origin}/$/`

//   if (url.startsWith(prefix)) {
//     const modifiedUrl = url.replace(prefix, 'https://cdn-nl-01.hasha.in/')
//     const newRequest = new Request(modifiedUrl, {
//       referrer: '',
//       referrerPolicy: 'no-referrer',
//     })
//     event.respondWith(fetch(newRequest))
//   }
// })

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.')
  event.notification.close()
  event.waitUntil(self.clients.openWindow('<https://your-website.com>'))
})
