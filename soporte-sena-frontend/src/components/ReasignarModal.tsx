import { useEffect, useRef, useState } from 'react'
import { X, UserCheck, AlertTriangle } from 'lucide-react'

export interface TecnicoOpcion {
  id: string
  nombre: string
}

interface Props {
  /** Casos pendientes no listados aqui; se filtra el tecnico actual. */
  tecnicoActualId?: string
  tecnicos: TecnicoOpcion[]
  onConfirm: (tecnicoId: string, motivo: string) => Promise<void>
  onClose: () => void
}

/**
 * Modal de reasignacion de caso: seleccion del nuevo tecnico (excluye al
 * actual) + motivo opcional. Usado por el tecnico asignado y el administrador.
 */
export default function ReasignarModal({ tecnicoActualId, tecnicos, onConfirm, onClose }: Props) {
  const [tecnicoId, setTecnicoId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  const disponibles = tecnicos.filter(t => String(t.id) !== String(tecnicoActualId))

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [onClose])

  const confirmar = async () => {
    if (!tecnicoId) {
      setError('Selecciona el tecnico al que se reasigna el caso')
      return
    }
    setError('')
    setCargando(true)
    try {
      await onConfirm(tecnicoId, motivo.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reasignar el caso')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-8 sm:pb-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-sena-green/10 rounded-xl flex items-center justify-center">
              <UserCheck size={17} className="text-sena-green" />
            </div>
            <h3 className="font-black text-gray-900 text-base">Reasignar caso</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Nuevo técnico <span className="text-red-500">*</span>
            </label>
            <select
              value={tecnicoId}
              onChange={e => { setTecnicoId(e.target.value); setError('') }}
              className="w-full px-3.5 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green"
            >
              <option value="">Selecciona un técnico...</option>
              {disponibles.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
            {disponibles.length === 0 && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={12} /> No hay otros técnicos activos para reasignar
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Motivo <span className="text-gray-300 font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej. El técnico actual no puede continuar con el caso..."
              rows={2}
              maxLength={255}
              className="w-full px-3.5 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={confirmar}
            disabled={cargando || disponibles.length === 0}
            className="w-full bg-sena-green text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-200 hover:bg-sena-dark active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <UserCheck size={16} /> {cargando ? 'Reasignando...' : 'Reasignar caso'}
          </button>
        </div>
      </div>
    </div>
  )
}
