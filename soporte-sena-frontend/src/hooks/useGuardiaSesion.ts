import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// La sesion solo se cierra manualmente o tras 30 minutos sin actividad.
// El contador corre mientras la app esta abierta (se reinicia con cualquier
// interaccion); al cerrar la app no se pierde (el token vive en localStorage).
const INACTIVIDAD_MS = 30 * 60 * 1000

export type ModoDialogo = 'atras' | 'inactividad' | null

function esRutaProtegida(p: string) {
  return p === '/admin' || p.startsWith('/admin') || p === '/casos' || p.startsWith('/casos')
}

function inicioPorRol(usuario: unknown): string {
  const rol = (usuario as { rol?: { nombre?: string } | string })?.rol
  const nombre = typeof rol === 'object' ? rol?.nombre : rol
  return String(nombre ?? '').toLowerCase() === 'administrador' ? '/admin' : '/casos'
}

/**
 * Guardia de sesion a nivel de app:
 * - El boton atras nunca saca del area de trabajo: si se intenta volver a
 *   /login o a la portada estando logueado, se restaura la pantalla y se
 *   pregunta "¿Quieres cerrar sesion?".
 * - Tras 30 minutos sin actividad (tocar, teclear, scroll) se ofrece
 *   continuar la sesion o cerrarla.
 */
export function useGuardiaSesion() {
  const { usuario, logout } = useAuth() as { usuario: unknown; logout: () => void }
  const navigate = useNavigate()
  const location = useLocation()
  const [dialogo, setDialogo] = useState<ModoDialogo>(null)

  const usuarioRef = useRef(usuario)
  const dialogoRef = useRef<ModoDialogo>(null)
  const ultimaRutaRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  dialogoRef.current = dialogo
  useEffect(() => {
    usuarioRef.current = usuario
  }, [usuario])

  // Recuerda la ultima pantalla de trabajo para restaurarla si el boton atras
  // intenta salir del area protegida.
  useEffect(() => {
    if (esRutaProtegida(location.pathname)) {
      ultimaRutaRef.current = location.pathname + location.search
    }
  }, [location.pathname, location.search])

  const limpiarTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const iniciarTimer = () => {
    limpiarTimer()
    timerRef.current = setTimeout(() => {
      if (usuarioRef.current && !dialogoRef.current) {
        setDialogo('inactividad')
      }
    }, INACTIVIDAD_MS)
  }

  // Inactividad: cualquier interaccion reinicia el contador; al volver a la
  // app (app estaba en segundo plano) tambien se reinicia.
  useEffect(() => {
    if (!usuario) {
      limpiarTimer()
      return
    }
    iniciarTimer()

    const eventos = ['pointerdown', 'keydown', 'touchstart', 'wheel']
    const onActividad = () => {
      if (dialogoRef.current) return
      iniciarTimer()
    }
    const onVisibilidad = () => {
      if (document.visibilityState === 'visible') {
        if (!dialogoRef.current) iniciarTimer()
      }
    }

    for (const e of eventos) window.addEventListener(e, onActividad)
    document.addEventListener('visibilitychange', onVisibilidad)
    return () => {
      for (const e of eventos) window.removeEventListener(e, onActividad)
      document.removeEventListener('visibilitychange', onVisibilidad)
      limpiarTimer()
    }
  }, [usuario])

  // Boton atras / reapertura de la PWA: si el usuario logueado esta en una
  // pagina publica (portada, login, reportar, consultar...), es porque salio
  // del area de trabajo con el boton atras (o la app reabrio en la portada).
  // Se restaura su ultima pantalla de trabajo y, si venia de la app, se
  // pregunta si quiere cerrar sesion. Funciona con el estado del router, no
  // con eventos popstate (que compiten con el procesamiento interno del
  // router), asi que es identico en iOS, Android y PC.
  useEffect(() => {
    if (!usuario || esRutaProtegida(location.pathname)) return
    const veniaDeLaApp = Boolean(ultimaRutaRef.current)
    navigate(ultimaRutaRef.current || inicioPorRol(usuario), { replace: true })
    if (veniaDeLaApp) setDialogo('atras')
  }, [usuario, location.pathname, navigate])

  const cancelar = () => setDialogo(null)

  const continuarSesion = () => {
    setDialogo(null)
    iniciarTimer()
  }

  const confirmarCerrar = () => {
    logout()
    setDialogo(null)
    navigate('/login', { replace: true })
  }

  return { dialogo, cancelar, continuarSesion, confirmarCerrar }
}
