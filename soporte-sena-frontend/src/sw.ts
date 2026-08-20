/// <reference lib="webworker" />
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

// Badge API: TS solo la declara en Navigator, pero en el worker vive en
// ServiceWorkerRegistration (vite-env.d.ts). Este type guard comprueba que el
// navegador realmente la soporte y le da el tipo correcto al registro.
interface RegistroConBadge extends ServiceWorkerRegistration {
  setAppBadge: (conteo: number) => Promise<void>
  clearAppBadge: () => Promise<void>
}

function puedeAplicarBadge(registro: ServiceWorkerRegistration): registro is RegistroConBadge {
  return 'setAppBadge' in registro
}

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
    // 'registro' es una const local: sobre 'self' (let global) TS no estrecha
    // tipos, asi que el chequeo 'in' no funcionaria.
    const registro = self.registration
    const tareas: Array<Promise<unknown>> = [
      registro.showNotification(title, options).catch(() => {}),
    ]
    const pendientes = Number(data.pendientes)
    if (Number.isFinite(pendientes) && puedeAplicarBadge(registro)) {
      tareas.push(registro.setAppBadge(pendientes).catch(() => {}))
    }
    await Promise.all(tareas)
  })())
})

// Actualizacion automatica: apenas el navegador descarga un sw.js nuevo (cada
// deploy), el worker nuevo se activa de inmediato y toma el control de todas
// las pestanas abiertas (skipWaiting + clients.claim). En la pagina, el
// evento 'controllerchange' de useVersionCheck recarga y queda la version mas
// reciente, sin depender de que el usuario toque el banner. Sin esto, un SW
// viejo sigue controlando la sesion entera (p. ej. un tecnico invitado que
// abre el link del correo con la PWA instalada de visitas previas) y sirve el
// precache viejo hasta que alguien confirma el banner de actualizacion.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  self.clients.claim()
})

// Aviso de nueva version: la app detecta que este SW quedo en 'waiting' y
// le pide activarse; al activarse se dispara 'controllerchange' y la pagina
// recarga con la version nueva. Es el mecanismo de actualizacion: el banner
// "Actualizar nueva version" es quien controla cuando se activa el SW nuevo.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Al tocar la notificacion: abre la app directamente en el caso mencionado.
// El backend incluye data.url segun el rol (tecnico: /casos/NUM; admin:
// /admin?caso=NUM). Si ya hay una pestana en esa seccion, se enfoca y navega;
// si no, se abre una ventana nueva con el caso.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const registro = self.registration
  if (puedeAplicarBadge(registro)) {
    registro.clearAppBadge().catch(() => {})
  }
  const destino = new URL((event.notification.data as { url?: string })?.url || '/', self.location.origin).toString()
  event.waitUntil((async () => {
    const clientes = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const base = new URL(destino).pathname.split('/')[1] || ''
    const objetivo = clientes.find((c) => {
      try { return new URL(c.url).pathname.startsWith(`/${base}`) } catch { return false }
    }) || (base === '' ? clientes[0] : undefined)
    if (objetivo) {
      await objetivo.focus()
      try { await objetivo.navigate(destino) } catch { /* se queda en la pestana actual */ }
      return
    }
    return self.clients.openWindow(destino)
  })())
})
