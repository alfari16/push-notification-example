workbox.clientsClaim()
workbox.skipWaiting()

workbox.routing.registerRoute(
  new RegExp('http://localhost:3000'),
  workbox.strategies.staleWhileRevalidate()
)

self.addEventListener('notificationclick', e => {
  this.clients.matchAll().then(clients => {
    const client = clients.find(el => el.visibilityState === 'visible')
    if (!client) {
      // this.clients.openWindow('https://ingat-sholat.herokuapp.com')
      this.clients.openWindow('http://localhost:3000')
    } else {
      // client.navigate('https://ingat-sholat.herokuapp.com')
      client.navigate('http://localhost:3000')
      client.focus()
    }
    self.registration.getNotifications()
      .then(notifications => {
        notifications.forEach(notif => notif.close())
      })
  })
})

self.addEventListener('push', async e => {
  const data = e.data.json()
  const title = `Waktunya Sholat ${data.sholat} untuk wilayah ${data.kota} dan sekitarnya.`
  var options = {
    body: 'Tap untuk memperbarui waktu',
    icon: '/dist/static/img/icon.png',
    vibrate: [100, 50, 100]
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

workbox.precaching.precacheAndRoute(self.__precacheManifest || [])
