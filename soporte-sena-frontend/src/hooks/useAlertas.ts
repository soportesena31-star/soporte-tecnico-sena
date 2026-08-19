import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api, getToken, API_URL } from '../api/client'

// Evento global que avisa a las paginas cuando el backend publica cualquier
// cambio de casos (nuevo_caso o caso_actualizado) por el stream SSE. Las
// paginas se suscriben con useCasoActualizado() para recargar sus datos.
export const EVENTO_CASO_ACTUALIZADO = 'soporte:caso_actualizado'

function difundirCambioDeCaso() {
  window.dispatchEvent(new Event(EVENTO_CASO_ACTUALIZADO))
}

// Evento global que avisa a las paginas cuando el backend publica un cambio
// de horarios (semana guardada o catalogo de turnos editado) por el stream
// SSE. Las paginas se suscriben con useHorarioActualizado() para recargar.
export const EVENTO_HORARIO_ACTUALIZADO = 'soporte:horario_actualizado'

function difundirCambioDeHorario() {
  window.dispatchEvent(new Event(EVENTO_HORARIO_ACTUALIZADO))
}

// Clave publica VAPID (solo lectura). Se define en Railway como VITE_VAPID_PUBLIC_KEY.
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Norm = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Norm)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

// Tono de alerta generado con Web Audio API (sin archivos): tres bips.
let ctxRef: AudioContext | null = null
function sonarAlerta() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!ctxRef) ctxRef = new Ctx()
    const ctx = ctxRef
    if (ctx.state === 'suspended') void ctx.resume()
    const frecuencias = [880, 1174, 880]
    frecuencias.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      const t0 = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.5, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + 0.16)
    })
  } catch {
    // Sin soporte de audio: la notificacion push del sistema sigue sonando.
  }
}

function vibrar() {
  if ('vibrate' in navigator) {
    try { navigator.vibrate([200, 100, 200, 100, 300]) } catch { /* ignora */ }
  }
}

/**
 * Alerta global de casos nuevos:
 * 1. Escucha el stream SSE /api/eventos mientras la app esta abierta y, si
 *    llega un caso nuevo, reproduce el tono de alerta + vibra + notificacion.
 * 2. Suscripcion Web Push (suena aun con la app cerrada, via service worker).
 *    - Android/Chrome: el prompt de permiso puede pedirse automaticamente.
 *    - iOS: solo muestra el prompt dentro de un gesto del usuario, asi que se
 *      expone `permisoPendiente` + `activarAlertas()` para que la UI muestre
 *      un boton que dispare la solicitud al ser tocado.
 *    - Si el permiso quedo bloqueado (denied) se expone `permisoDenegado`
 *      para avisar que debe activarse desde los ajustes del navegador.
 */
export function useAlertas() {
  const { usuario } = useAuth()
  const sseRef = useRef<EventSource | null>(null)
  const [permisoPendiente, setPermisoPendiente] = useState(false)
  const [permisoDenegado, setPermisoDenegado] = useState(false)
  const [activando, setActivando] = useState(false)

  const esIOS = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  const suscribirPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (!VAPID_PUBLIC) return
    try {
      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC).buffer as ArrayBuffer,
        })
      }
      await api.push.suscribir({
        endpoint: sub.endpoint,
        keys: { p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))), auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))) },
      })
    } catch {
      // Sin permiso o navegador sin push: la alerta SSE sigue funcionando.
    }
  }

  const pedirPermiso = async () => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const evaluarPermiso = useCallback(() => {
    if (!('Notification' in window)) return
    const estado = Notification.permission
    const haySoporte = haySoportePush()
    if (estado === 'default' && haySoporte) {
      setPermisoPendiente(true)
      setPermisoDenegado(false)
    } else if (estado === 'denied' && haySoporte) {
      setPermisoPendiente(false)
      setPermisoDenegado(true)
    } else {
      setPermisoPendiente(false)
      setPermisoDenegado(false)
    }
  }, [])

  /**
   * Debe llamarse dentro del gesto del usuario (onClick) para que Safari/iOS
   * muestre el prompt de permiso. Suscribe el dispositivo a Web Push.
   */
  const activarAlertas = useCallback(async () => {
    setActivando(true)
    await pedirPermiso()
    await suscribirPush()
    setActivando(false)
    evaluarPermiso()
  }, [evaluarPermiso])

  useEffect(() => {
    if (!usuario) return
    const u = usuario as { rol?: unknown }
    const rol = (typeof u.rol === 'object' && u.rol !== null && typeof (u.rol as { nombre?: string }).nombre === 'string'
      ? (u.rol as { nombre: string }).nombre
      : typeof u.rol === 'string' ? u.rol : '') || ''
    const esPersonal = rol.toLowerCase() === 'tecnico' || rol.toLowerCase() === 'administrador'
    if (!esPersonal) return

    let cancelado = false

    const conectarSSE = () => {
      if (sseRef.current) return
      const base = API_URL.replace(/\/api\/?$/, '')
      const token = getToken()
      const es = new EventSource(`${base}/api/eventos?token=${encodeURIComponent(token || '')}`)
      sseRef.current = es

      es.addEventListener('nuevo_caso', () => {
        sonarAlerta()
        vibrar()
        // La notificacion la muestra el service worker del push (funciona
        // incluso con la app cerrada); aqui solo se suena y vibra en el panel
        // abierto. Crear otra con new Notification duplicaria el aviso.
        // Ademas se difunde el cambio para que las paginas recarguen sus datos.
        difundirCambioDeCaso()
      })

      // Cualquier otra accion sobre un caso (tomar, asignar, iniciar,
      // resolver, reabrir, nota): se difunde el cambio para que las paginas
      // recarguen en vivo sin recargar el navegador.
      es.addEventListener('caso_actualizado', () => {
        difundirCambioDeCaso()
      })

      // Cambios de horario (el admin guarda la semana de un tecnico o edita
      // el catalogo de turnos): los paneles abiertos recargan en vivo.
      es.addEventListener('horario_actualizado', () => {
        difundirCambioDeHorario()
      })

      es.onerror = () => {
        // Reconexion automatica del EventSource; cerrar y reabrir si se corta.
        es.close()
        sseRef.current = null
        if (!cancelado) setTimeout(conectarSSE, 5000)
      }
    }

    const evaluarYActivar = () => {
      if (!('Notification' in window) || !haySoportePush()) return
      if (Notification.permission === 'default') {
        if (esIOS()) {
          // iOS: el prompt requiere gesto del usuario, se muestra el banner.
          setPermisoPendiente(true)
        } else {
          // Android/Chrome: se puede pedir automaticamente.
          pedirPermiso().then(() => suscribirPush().finally(evaluarPermiso))
        }
      } else {
        evaluarPermiso()
        // Con permiso ya concedido tambien se (re)envia la suscripcion: es
        // idempotente y repara el dispositivo si su fila falta o quedo
        // corrupta en el backend (p. ej. el push deja de llegar).
        if (Notification.permission === 'granted') suscribirPush()
      }
    }

    evaluarYActivar()
    conectarSSE()

    return () => {
      cancelado = true
      if (sseRef.current) {
        sseRef.current.close()
        sseRef.current = null
      }
    }
  }, [usuario, evaluarPermiso])

  return { permisoPendiente, permisoDenegado, activando, activarAlertas }
}

export function haySoportePush() {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC
}
