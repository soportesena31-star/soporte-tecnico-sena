import { useEffect, useRef, useState } from 'react'
import { X, Lock, AlertTriangle } from 'lucide-react'

interface Props {
  numeroCaso: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

/**
 * Modal de confirmacion para cerrar un caso (solo administrador): es la
 * confirmacion final de que el caso quedo atendido correctamente.
 */
export default function CerrarModal({ numeroCaso, onConfirm, onClose }: Props) {
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
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar el caso')
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
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <Lock size={17} className="text-gray-600" />
            </div>
            <h3 className="font-black text-gray-900 text-base">Cerrar caso</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Vas a cerrar definitivamente el caso <span className="font-mono font-bold text-gray-900">{numeroCaso}</span>.
          Quedará marcado como <span className="font-bold text-gray-900">Cerrado</span> y solo podrá reactivarse
          reabriéndolo.
        </p>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2">
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={cargando}
            className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={cargando}
            className="flex-1 bg-sena-navy text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-[#243550] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <Lock size={16} /> {cargando ? 'Cerrando...' : 'Sí, cerrar caso'}
          </button>
        </div>
      </div>
    </div>
  )
}
