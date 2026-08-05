import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { api, getToken, API_URL } from '../api/client'

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
 * 1. Solicita permiso de notificaciones y suscribe el dispositivo a Web Push
 *    (suena aun con la app cerrada, via service worker).
 * 2. Escucha el stream SSE /api/eventos mientras la app esta abierta y, si
 *    llega un caso nuevo, reproduce el tono de alerta + vibra + notificacion.
 */
export function useAlertas() {
  const { usuario } = useAuth()
  const sseRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!usuario) return
    const u = usuario as { rol?: unknown }
    const rol = (typeof u.rol === 'object' && u.rol !== null && typeof (u.rol as { nombre?: string }).nombre === 'string'
      ? (u.rol as { nombre: string }).nombre
      : typeof u.rol === 'string' ? u.rol : '') || ''
    const esPersonal = rol.toLowerCase() === 'tecnico' || rol.toLowerCase() === 'administrador'
    if (!esPersonal) return

    let cancelado = false

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

    const conectarSSE = () => {
      if (sseRef.current) return
      const base = API_URL.replace(/\/api\/?$/, '')
      const token = getToken()
      const es = new EventSource(`${base}/api/eventos?token=${encodeURIComponent(token || '')}`)
      sseRef.current = es

      es.addEventListener('nuevo_caso', () => {
        sonarAlerta()
        vibrar()
        if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState === 'visible') {
          new Notification('Nuevo caso de soporte', { body: 'Llego un caso nuevo', icon: '/icons/icon-192.png' })
        }
      })

      es.onerror = () => {
        // Reconexion automatica del EventSource; cerrar y reabrir si se corta.
        es.close()
        sseRef.current = null
        if (!cancelado) setTimeout(conectarSSE, 5000)
      }
    }

    pedirPermiso().then(suscribirPush)
    conectarSSE()

    return () => {
      cancelado = true
      if (sseRef.current) {
        sseRef.current.close()
        sseRef.current = null
      }
    }
  }, [usuario])
}

export function haySoportePush() {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC
}
