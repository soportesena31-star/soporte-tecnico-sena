import { useState } from 'react'
import { Bell, X } from 'lucide-react'

interface Props {
  permisoPendiente: boolean
  permisoDenegado: boolean
  activando: boolean
  activarAlertas: () => void
}

export default function BannerNotificaciones({ permisoPendiente, permisoDenegado, activando, activarAlertas }: Props) {
  const [descartado, setDescartado] = useState(false)
  if (!permisoPendiente && !permisoDenegado) return null
  if (descartado) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] sm:left-auto sm:right-6 sm:max-w-sm">
      <div className={`rounded-xl shadow-lg p-4 flex items-start gap-3 ${permisoDenegado ? 'bg-amber-600 text-white' : 'bg-[#12402c] text-white'}`}>
        <div className="mt-0.5 shrink-0">
          <Bell size={20} />
        </div>
        <div className="flex-1">
          {permisoDenegado ? (
            <>
              <p className="text-sm font-semibold">Notificaciones bloqueadas</p>
              <p className="text-xs text-white/90 mt-0.5 leading-snug">
                Activalas desde los ajustes del navegador (icono de candado junto a la URL, o Ajustes del
                telefono) y vuelve a abrir la app.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">Activa las alertas de casos</p>
              <p className="text-xs text-white/80 mt-0.5 leading-snug">
                Recibe una notificacion con sonido cuando llegue un caso nuevo, incluso con la app cerrada.
              </p>
              <button
                type="button"
                disabled={activando}
                onClick={activarAlertas}
                className="mt-3 w-full rounded-lg bg-white text-[#12402c] text-sm font-semibold py-2 px-3 disabled:opacity-60"
              >
                {activando ? 'Activando...' : 'Activar notificaciones'}
              </button>
            </>
          )}
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
