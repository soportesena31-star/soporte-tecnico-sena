import { Bell } from 'lucide-react'

interface Props {
  permisoPendiente: boolean
  activando: boolean
  activarAlertas: () => void
}

export default function BannerNotificaciones({ permisoPendiente, activando, activarAlertas }: Props) {
  if (!permisoPendiente) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] sm:left-auto sm:right-6 sm:max-w-sm">
      <div className="rounded-xl bg-[#12402c] text-white shadow-lg p-4 flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Bell size={20} />
        </div>
        <div className="flex-1">
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
        </div>
      </div>
    </div>
  )
}
