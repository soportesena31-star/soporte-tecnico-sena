/// <reference lib="webworker" />
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

// Precache de los archivos del build (lo mismo que hacia generateSW).
precacheAndRoute(self.__WB_MANIFEST)

// SPA: cualquier navegacion interna cae al index.html (excepto /api, que
// nunca debe servirse desde cache).
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//],
  }),
)

// Notificacion push: llega cuando el backend crea un caso y este dispositivo
// esta suscrito. Muestra la notificacion (que suena/vibra en el celular).
self.addEventListener('push', (event) => {
  let data: { title?: string; body?: string; icon?: string; badge?: string; data?: unknown; pendientes?: number } = {}
  try {
    data = event.data?.json() || {}
  } catch {
    data = { title: 'Nueva alerta', body: event.data?.text() }
  }

  const title = data.title || 'SENA Soporte Técnico'
  const options: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
    body: data.body || 'Tienes una nueva alerta',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    // Vibra 2 veces: patron corto-largo-corto.
    vibrate: [200, 100, 200, 100, 300],
    tag: `caso-${Date.now()}`,
    data: data.data || {},
    renotify: true,
  }

  event.waitUntil((async () => {
    // Badge y notificacion en paralelo: el contador se aplica al icono en el
    // mismo instante en que llega el push (aunque la notificacion tarde o
    // falle, el badge ya quedo puesto).
    const tareas: Array<Promise<unknown>> = [
      self.registration.showNotification(title, options).catch(() => {}),
    ]
    const pendientes = Number(data.pendientes)
    if (Number.isFinite(pendientes) && 'setAppBadge' in self.registration) {
      tareas.push(self.registration.setAppBadge(pendientes).catch(() => {}))
    }
    await Promise.all(tareas)
  })())
})

// Aviso de nueva version: la app detecta que este SW quedo en 'waiting' y
// le pide activarse; al activarse se dispara 'controllerchange' y la pagina
// recarga con la version nueva.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Al tocar la notificacion: abre la app (y enfoca la pestana si ya existe).
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if ('clearAppBadge' in self.registration) {
    self.registration.clearAppBadge().catch(() => {})
  }
  const url = new URL('/', self.location.origin).toString()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
