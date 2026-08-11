import { useEffect, useRef, useState } from 'react'
import { X, RotateCcw, AlertTriangle } from 'lucide-react'

interface Props {
  numeroCaso: string
  onConfirm: (motivo: string) => Promise<void>
  onClose: () => void
}

/**
 * Modal para reabrir un caso (solo administrador): un caso resuelto o cerrado
 * vuelve al estado Reabierto para que el tecnico asignado retome el trabajo.
 * El motivo (opcional) queda registrado en el historial.
 */
export default function ReabrirModal({ numeroCaso, onConfirm, onClose }: Props) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [onClose])

  const confirmar = async () => {
    setError('')
    setCargando(true)
    try {
      await onConfirm(motivo.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reabrir el caso')
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
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <RotateCcw size={17} className="text-red-600" />
            </div>
            <h3 className="font-black text-gray-900 text-base">Reabrir caso</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Vas a reabrir el caso <span className="font-mono font-bold text-gray-900">{numeroCaso}</span>.
          Volverá a la cola activa con estado <span className="font-bold text-gray-900">Reabierto</span> y el técnico
          asignado podrá retomar el trabajo.
        </p>

        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Motivo <span className="text-gray-300 font-normal normal-case">(opcional)</span>
          </label>
          <textarea
            value={motivo}
            onChange={e => { setMotivo(e.target.value); setError('') }}
            placeholder="Ej. El usuario reporta que el problema persiste..."
            rows={3}
            maxLength={255}
            className="w-full px-3.5 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
          />
        </div>

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2">
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={confirmar}
          disabled={cargando}
          className="w-full bg-red-600 text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all mt-5 disabled:opacity-60"
        >
          <RotateCcw size={16} /> {cargando ? 'Reabriendo...' : 'Reabrir caso'}
        </button>
      </div>
    </div>
  )
}
