import { useState, useEffect } from 'react'
import { Search, MapPin, Tag, User, Clock, ChevronLeft, AlertCircle } from 'lucide-react'
import { STATUS_COLORS, PRIORITY_COLORS, formatDate, type CaseStatus } from '../data/mockData'

const TIMELINE_STEPS = ['Abierto', 'Asignado', 'En proceso', 'Resuelto', 'Cerrado']

interface Props {
  initialCase?: string
  onSearch: (numero: string) => Promise<any | null>
  onBack: () => void
}

export default function TrackCase({ initialCase, onSearch, onBack }: Props) {
  const [query, setQuery] = useState(initialCase || '')
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [found, setFound] = useState<any | null>(null)
  const [errorRed, setErrorRed] = useState(false)

  const runSearch = async (numero: string) => {
    if (!numero.trim()) return
    setLoading(true)
    setErrorRed(false)
    try {
      const resultado = await onSearch(numero.trim())
      setFound(resultado)
    } catch {
      setFound(null)
      setErrorRed(true)
    } finally {
      setSearched(true)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialCase) runSearch(initialCase)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCase])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(query)
  }

  const currentStepIndex = found ? TIMELINE_STEPS.indexOf(found.status) : -1

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Header */}
      <div className="bg-sena-green text-white px-4 pt-12 pb-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-green-100 text-sm mb-4 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Volver
        </button>
        <h1 className="text-2xl font-bold">Consultar caso</h1>
        <p className="text-green-100 text-sm mt-1">Ingresa tu número de caso para ver el estado</p>
      </div>

      <div className="px-4 -mt-2 max-w-lg mx-auto">
        {/* Search form */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 mb-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Número de caso</label>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ej: CASO-2026-0034"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green transition-colors font-mono"
            />
            <button type="submit" disabled={loading} className="bg-sena-green text-white px-4 py-3 rounded-xl hover:bg-sena-dark transition-colors disabled:opacity-70">
              {loading ? (
                <svg className="animate-spin w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
              ) : <Search size={18} />}
            </button>
          </div>
        </form>

        {/* Results */}
        {searched && errorRed && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">No pudimos consultar el caso</p>
            <p className="text-sm text-gray-400 mt-1">Revisa tu conexión e intenta de nuevo.</p>
          </div>
        )}
        {searched && !errorRed && !found && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">Caso no encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Verifica el número e intenta de nuevo.</p>
          </div>
        )}

        {found && (
          <div className="space-y-4 pb-10">
            {/* Status badge + case number */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Número de caso</p>
                  <p className="text-xl font-bold text-gray-900 font-mono">{found.number}</p>
                </div>
                <StatusBadge status={found.status} />
              </div>
              <PriorityBadge priority={found.priority} />
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Progreso del caso</h3>
              <div className="relative">
                {/* Track line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
                <div className="space-y-0">
                  {(found.status === 'Reabierto' ? [...TIMELINE_STEPS, 'Reabierto' as CaseStatus] : TIMELINE_STEPS).map((step, idx) => {
                    const effectiveIdx = found.status === 'Reabierto' ? TIMELINE_STEPS.length : currentStepIndex
                    const isDone = idx < effectiveIdx
                    const isCurrent = found.status === 'Reabierto' ? step === 'Reabierto' : step === found.status
                    return (
                      <div key={step} className="flex items-start gap-4 relative pb-4 last:pb-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-xs font-bold border-2 transition-colors ${
                          isCurrent ? 'bg-sena-green border-sena-green text-white'
                          : isDone ? 'bg-green-100 border-green-300 text-green-600'
                          : 'bg-white border-gray-200 text-gray-300'
                        }`}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <div className="pt-1.5">
                          <p className={`text-sm font-semibold ${isCurrent ? 'text-sena-green' : isDone ? 'text-gray-600' : 'text-gray-300'}`}>{step}</p>
                          {isCurrent && <p className="text-xs text-gray-400 mt-0.5">{formatDate(found.updatedAt)}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Case info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Información del caso</h3>
              <InfoRow icon={<MapPin size={13} />} label="Ubicación" value={`${found.space.name} · ${found.space.type}`} />
              <InfoRow icon={<Tag size={13} />} label="Categoría" value={found.category} />
              <InfoRow icon={<User size={13} />} label="Reportado por" value={found.reportedBy} />
              <InfoRow icon={<Clock size={13} />} label="Creado" value={formatDate(found.createdAt)} />
              {found.assignedTo && <InfoRow icon={<User size={13} />} label="Técnico asignado" value={found.assignedTo.name} highlight />}
              {found.updatedAt !== found.createdAt && <InfoRow icon={<Clock size={13} />} label="Última actualización" value={formatDate(found.updatedAt)} />}
              <div className="pt-2 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-1">Descripción</p>
                <p className="text-sm text-gray-700 leading-relaxed">{found.description}</p>
              </div>
            </div>

            {/* Timeline events */}
            {found.timeline.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Historial</h3>
                <div className="space-y-4">
                  {found.timeline.map((ev: any, i: number) => (
                    <div key={ev.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${i === 0 ? 'bg-sena-green' : 'bg-gray-300'}`} />
                        {i < found.timeline.length - 1 && <div className="w-0.5 bg-gray-100 flex-1 mt-1" />}
                      </div>
                      <div className="pb-4 last:pb-0">
                        <p className="text-xs text-gray-400">{formatDate(ev.date)}</p>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">{ev.action}</p>
                        {ev.note && <p className="text-xs text-gray-500 mt-0.5 italic">"{ev.note}"</p>}
                        <p className="text-xs text-sena-green mt-0.5">{ev.actor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS['Abierto']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const c = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS['Baja']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      Prioridad {priority}
    </span>
  )
}

function InfoRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-1.5 text-gray-400 text-xs flex-shrink-0 mt-0.5">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`text-xs font-medium text-right ${highlight ? 'text-sena-green' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}
