import { CheckCircle, MapPin, Tag, Clock, RotateCcw, Search } from 'lucide-react'
import type { NoveltyType, Space } from '../data/mockData'
import { formatDate } from '../data/mockData'

interface Props {
  caseNumber: string
  space: Space
  category: NoveltyType
  createdAt: string
  onTrack: () => void
  onNewReport: () => void
}

export default function Confirmation({ caseNumber, space, category, createdAt, onTrack, onNewReport }: Props) {
  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      {/* Success header */}
      <div className="bg-sena-green text-white px-4 pt-16 pb-10 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
          <CheckCircle size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold">¡Reporte enviado!</h1>
        <p className="text-green-100 text-sm mt-1">Tu solicitud fue registrada correctamente</p>
      </div>

      {/* Case number card */}
      <div className="mx-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Número de caso</p>
          <p className="text-3xl font-bold text-sena-green tracking-tight">{caseNumber}</p>
          <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-amber-400 rounded-full inline-block" />
            Guarda este número para consultar el avance de tu solicitud.
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Resumen del reporte</h2>
        <div className="divide-y divide-gray-50 space-y-0">
          <DetailRow icon={<Clock size={14} />} label="Fecha y hora" value={formatDate(createdAt)} />
          <DetailRow icon={<MapPin size={14} />} label="Ubicación" value={`${space.name} · ${space.type}`} />
          <DetailRow icon={<Tag size={14} />} label="Tipo de novedad" value={category} />
          <DetailRow icon={<span className="text-xs font-bold">Estado</span>} label="Estado" value="Abierto" valueClass="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold" />
        </div>
      </div>

      {/* Actions */}
      <div className="mx-4 mt-4 space-y-3 pb-10">
        <button
          onClick={onTrack}
          className="w-full bg-sena-green text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-green-200 hover:bg-sena-dark transition-colors"
        >
          <Search size={16} />
          Consultar estado del caso
        </button>
        <button
          onClick={onNewReport}
          className="w-full bg-white text-sena-green py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 border-sena-green/20 hover:bg-green-50 transition-colors"
        >
          <RotateCcw size={16} />
          Reportar otra novedad
        </button>
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 text-gray-400 text-xs min-w-0">
        {icon}
        <span>{label}</span>
      </div>
      {valueClass ? (
        <span className={valueClass}>{value}</span>
      ) : (
        <span className="text-xs font-medium text-gray-800 text-right max-w-[55%]">{value}</span>
      )}
    </div>
  )
}
