import { useEffect } from 'react'
import { EVENTO_CASO_ACTUALIZADO } from './useAlertas'

// Permite a cualquier pagina recargar sus datos cuando el backend publica un
// cambio de casos (nuevo_caso o caso_actualizado) por el stream SSE. El
// callback debe ser estable (useCallback) para no reconectar el listener.
export function useCasoActualizado(onCambio: () => void) {
  useEffect(() => {
    const manejar = () => onCambio()
    window.addEventListener(EVENTO_CASO_ACTUALIZADO, manejar)
    return () => window.removeEventListener(EVENTO_CASO_ACTUALIZADO, manejar)
  }, [onCambio])
}
