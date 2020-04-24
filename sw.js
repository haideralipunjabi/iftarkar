importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

workbox.googleAnalytics.initialize()
workbox.routing.registerRoute(
  /assets/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-files',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        purgeOnQuotaError: true,
        maxEntries: 100

      })
    ]
  })
)
workbox.routing.setDefaultHandler(new workbox.strategies.StaleWhileRevalidate({
  cacheName: 'extra',
  plugins: [
    new workbox.expiration.ExpirationPlugin({
      purgeOnQuotaError: true,
      maxEntries: 100
    })
  ]
}))
