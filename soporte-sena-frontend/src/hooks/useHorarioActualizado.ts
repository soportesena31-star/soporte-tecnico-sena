import { useEffect } from 'react'
import { EVENTO_HORARIO_ACTUALIZADO } from './useAlertas'

// Permite a cualquier pagina recargar su horario cuando el backend publica
// un cambio (semana guardada o catalogo de turnos editado) por el stream
// SSE. El callback debe ser estable (useCallback) para no reconectar el
// listener.
export function useHorarioActualizado(onCambio: () => void) {
  useEffect(() => {
    const manejar = () => onCambio()
    window.addEventListener(EVENTO_HORARIO_ACTUALIZADO, manejar)
    return () => window.removeEventListener(EVENTO_HORARIO_ACTUALIZADO, manejar)
  }, [onCambio])
}