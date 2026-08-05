import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

interface Props {
  hayActualizacion: boolean
  aplicarActualizacion: () => void
}

export default function VersionBanner({ hayActualizacion, aplicarActualizacion }: Props) {
  const [descartado, setDescartado] = useState(false)
  if (!hayActualizacion || descartado) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[70] sm:left-auto sm:right-6 sm:max-w-sm">
      <div className="rounded-xl shadow-lg p-4 flex items-start gap-3 bg-sena-green text-white">
        <div className="mt-0.5 shrink-0">
          <RefreshCw size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Nueva versión disponible</p>
          <p className="text-xs text-white/90 mt-0.5 leading-snug">
            Actualiza la app para ver los últimos cambios.
          </p>
          <button
            type="button"
            onClick={aplicarActualizacion}
            className="mt-3 w-full rounded-lg bg-white text-sena-green text-sm font-semibold py-2 px-3"
          >
            Actualizar
          </button>
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => setDescartado(true)}
          className="shrink-0 rounded-full p-1 hover:bg-white/20"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
