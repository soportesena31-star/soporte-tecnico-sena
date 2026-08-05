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

    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
  }, [])

  function aplicarActualizacion() {
    const waiting = registroRef.current?.waiting
    if (!waiting) return
    waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  return { hayActualizacion, aplicarActualizacion }
}
