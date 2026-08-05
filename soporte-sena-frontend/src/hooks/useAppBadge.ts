import { useEffect } from 'react'

// Badge de casos pendientes sobre el icono de la app (como el contador de
// WhatsApp). Solo funciona en PWA instalada y con soporte de Badge API
// (Chrome/Edge; en Android depende del launcher; iOS 16.4+ en Home Screen).
// Si el navegador no soporta la API, no pasa nada.
export function usarBadgePendientes(conteo: number | null) {
  useEffect(() => {
    if (conteo === null) return
    const nav = navigator as Navigator & {
      setAppBadge?: (conteo: number) => Promise<void>
      clearAppBadge?: () => Promise<void>
    }
    if (conteo > 0) {
      nav.setAppBadge?.(conteo).catch(() => {})
    } else {
      nav.clearAppBadge?.().catch(() => {})
    }
  }, [conteo])
}
