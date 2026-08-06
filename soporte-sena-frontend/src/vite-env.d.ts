/// <reference types="vite/client" />

// Badge API en el service worker: TypeScript solo la declara en Navigator,
// pero en el worker vive en ServiceWorkerRegistration (estandar real).
interface ServiceWorkerRegistration {
  setAppBadge?: (conteo: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}
