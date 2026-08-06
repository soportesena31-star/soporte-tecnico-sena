import { useEffect, useRef, useState } from 'react'

// Detecta cuando hay una version nueva de la app instalada (SW en 'waiting')
// para mostrarla en un banner. Al confirmar, activa el SW nuevo (SKIP_WAITING);
// 'controllerchange' recarga la pagina y queda la version nueva en uso.
export function useVersionCheck() {
  const [hayActualizacion, setHayActualizacion] = useState(false)
  const registroRef = useRef<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const onControllerChange = () => window.location.reload()
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const avisarSiHayNueva = () => {
      if (registroRef.current?.waiting && navigator.serviceWorker.controller) {
        setHayActualizacion(true)
      }
    }

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      registroRef.current = reg
      avisarSiHayNueva()

      reg.addEventListener('updatefound', () => {
        const nuevo = reg.installing
        nuevo?.addEventListener('statechange', () => {
          if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
            setHayActualizacion(true)
          }
        })
      })
    })

    // Comprobaciones extra de actualizacion: el navegador solo revisa sw.js
    // al NAVEGAR, asi que si la app queda abierta (aunque sea en segundo
    // plano) el banner de nueva version no aparece hasta recargar. Se fuerza
    // reg.update() al volver a la app (visibilitychange) y cada minuto.
    let ultimaRevision = 0
    const revisar = () => {
      const ahora = Date.now()
      if (ahora - ultimaRevision < 30_000) return
      ultimaRevision = ahora
      registroRef.current?.update().catch(() => {})
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') revisar()
    }
    document.addEventListener('visibilitychange', onVisibility)
    const intervalo = window.setInterval(revisar, 60_000)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(intervalo)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  function aplicarActualizacion() {
    const waiting = registroRef.current?.waiting
    if (!waiting) return
    waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  return { hayActualizacion, aplicarActualizacion }
}
