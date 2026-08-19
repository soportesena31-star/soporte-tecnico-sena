import { useState } from 'react'
import { MapPin, User, AlertCircle, FileText, Send, ChevronDown, Search, X } from 'lucide-react'
import PhotoPicker, { type PhotoItem } from './PhotoPicker'

interface Space {
  id: string
  name: string
  type: string
  sede: string
  active: boolean
}

interface Props {
  spaces: Space[]
  noveltyTypes: string[]
  priorityDefaults: Record<string, string>
  onSubmit: (data: { space?: Space; customLocation?: string; reportedBy: string; category: string; description: string; photoFiles: File[] }) => Promise<void>
}

const SPACE_TYPES = ['Ambientes', 'Laboratorios', 'Auditorios', 'Oficinas', 'Zonas comunes', 'Otros']
const TYPE_MAP: Record<string, string> = {
  'Ambientes': 'Ambiente',
  'Laboratorios': 'Laboratorio',
  'Auditorios': 'Auditorio',
  'Oficinas': 'Oficina',
  'Zonas comunes': 'Zona común',
  'Otros': 'Otro',
}

export default function ReportForm({ spaces, noveltyTypes, priorityDefaults, onSubmit }: Props) {
  const [step, setStep] = useState<'form' | 'space-picker'>('form')
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [isCustomSpace, setIsCustomSpace] = useState(false)
  const [customLocation, setCustomLocation] = useState('')
  const [reportedBy, setReportedBy] = useState('')
  const [category, setCategory] = useState<string>('')
  const [description, setDescription] = useState('')
  const [photosList, setPhotosList] = useState<PhotoItem[]>([])
  const [spaceSearch, setSpaceSearch] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const filteredSpaces = spaces.filter(s =>
    s.active && s.name.toLowerCase().includes(spaceSearch.toLowerCase())
  )

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selectedSpace && !isCustomSpace) e.space = 'Selecciona el espacio o la ubicación donde estás'
    if (isCustomSpace && !customLocation.trim()) e.customLocation = 'Describe la ubicación donde ocurrió la novedad'
    if (!reportedBy.trim()) e.reportedBy = 'Ingresa tu nombre'
    if (!category) e.category = 'Selecciona el tipo de novedad'
    if (!description.trim()) e.description = 'Describe brevemente el problema'
    if (photosList.length === 0) e.photos = 'Debes adjuntar al menos 1 fotografía (máximo 3)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSubmit({
        space: isCustomSpace ? undefined : selectedSpace!,
        customLocation: isCustomSpace ? customLocation.trim() : undefined,
        reportedBy,
        category,
        description,
        photoFiles: photosList.map(p => p.file)
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo enviar el reporte. Intenta de nuevo.')
      setSubmitting(false)
    }
  }

  if (step === 'space-picker') {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
        <div className="bg-sena-green text-white px-4 pt-12 pb-6">
          <button onClick={() => setStep('form')} className="flex items-center gap-2 text-green-100 mb-4 text-sm">
            <X size={16} /> Cancelar
          </button>
          <h2 className="text-xl font-semibold">¿Dónde estás?</h2>
          <p className="text-green-100 text-sm mt-1">Selecciona el espacio de la institución</p>
        </div>
        <div className="px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={spaceSearch}
              onChange={e => setSpaceSearch(e.target.value)}
              placeholder="Buscar espacio..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/30 focus:border-sena-green"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-8">
          {SPACE_TYPES.map(typeName => {
            const typeKey = TYPE_MAP[typeName]
            const group = filteredSpaces.filter(s => s.type === typeKey)
            if (group.length === 0) return null
            return (
              <div key={typeName}>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{typeName}</span>
                </div>
                {group.map(space => (
                  <button
                    key={space.id}
                    onClick={() => {
                      setSelectedSpace(space)
                      setIsCustomSpace(false)
                      setCustomLocation('')
                      setStep('form')
                      setErrors(e => ({ ...e, space: '', customLocation: '' }))
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-white hover:bg-green-50 active:bg-green-100 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-sena-green/10 flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} className="text-sena-green" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{space.name}</p>
                      <p className="text-xs text-gray-500">Sede {space.sede}</p>
                    </div>
                  </button>
                ))}
              </div>
            )
          })}

          {/* Opción de ubicación personalizada — al pie de la lista */}
          <div className="px-4 py-4 bg-amber-50 border-t-2 border-amber-200 sticky bottom-0">
            <button
              type="button"
              onClick={() => {
                setIsCustomSpace(true)
                setSelectedSpace(null)
                setStep('form')
                setErrors(e => ({ ...e, space: '', customLocation: '' }))
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border-2 border-amber-300 hover:border-amber-500 hover:bg-amber-50 active:bg-amber-100 transition-colors text-left shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-amber-700" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-amber-900 text-sm">📍 Otra ubicación (No listada)</p>
                <p className="text-xs text-amber-700 mt-0.5">El lugar no aparece en la lista — describir el sitio</p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg whitespace-nowrap">Seleccionar →</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Header */}
      <div className="bg-sena-green text-white px-4 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
              <rect width="40" height="40" rx="8" fill="#39A900" />
              <text x="20" y="27" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white" fontFamily="sans-serif">S</text>
            </svg>
          </div>
          <div>
            <p className="text-green-100 text-xs font-medium uppercase tracking-wider">SENA — Soporte TI</p>
            <p className="font-semibold text-sm">Servicio Nacional de Aprendizaje</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold">Reportar novedad</h1>
        <p className="text-green-100 text-sm mt-1">Ayúdanos a solucionar rápidamente cualquier inconveniente.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-4 max-w-lg mx-auto">
        {/* Location picker */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            <MapPin size={13} className="text-sena-green" /> Ubicación
          </label>
          {isCustomSpace ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <MapPin size={11} /> Ubicación no registrada
                </span>
                <button
                  type="button"
                  onClick={() => setStep('space-picker')}
                  className="text-xs text-sena-green font-semibold hover:underline"
                >
                  Cambiar →
                </button>
              </div>
              <input
                autoFocus
                value={customLocation}
                onChange={e => { setCustomLocation(e.target.value); setErrors(er => ({ ...er, customLocation: '' })) }}
                placeholder="Ej: Pasillo bloque B, frente a la cafetería..."
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none transition-colors ${
                  errors.customLocation ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50/50 focus:border-amber-500'
                }`}
              />
              {errors.customLocation && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12} />{errors.customLocation}</p>}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('space-picker')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-colors ${
                  errors.space ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50 hover:border-sena-green/30 hover:bg-green-50/50'
                }`}
              >
                {selectedSpace ? (
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm">{selectedSpace.name}</p>
                    <p className="text-xs text-gray-500">{selectedSpace.type} · Sede {selectedSpace.sede}</p>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">Seleccionar espacio...</span>
                )}
                <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
              </button>
              {errors.space && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{errors.space}</p>}
            </>
          )}
        </div>

        {/* Reporter name */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            <User size={13} className="text-sena-green" /> Nombre de quien reporta
          </label>
          <input
            value={reportedBy}
            onChange={e => { setReportedBy(e.target.value); setErrors(er => ({ ...er, reportedBy: '' })) }}
            placeholder="Tu nombre completo"
            className={`w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green transition-colors ${errors.reportedBy ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
          />
          {errors.reportedBy && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{errors.reportedBy}</p>}
        </div>

        {/* Category */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            <AlertCircle size={13} className="text-sena-green" /> Tipo de novedad
          </label>
          <div className="grid grid-cols-2 gap-2">
            {noveltyTypes.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => { setCategory(type); setErrors(er => ({ ...er, category: '' })) }}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors border-2 ${
                  category === type
                    ? 'border-sena-green bg-sena-green text-white'
                    : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-sena-green/30 hover:bg-green-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          {category && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              Prioridad sugerida: <span className={`font-semibold ${priorityDefaults[category] === 'Alta' ? 'text-red-600' : priorityDefaults[category] === 'Media' ? 'text-amber-600' : 'text-gray-600'}`}>{priorityDefaults[category]}</span>
            </p>
          )}
          {errors.category && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{errors.category}</p>}
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            <FileText size={13} className="text-sena-green" /> Descripción
          </label>
          <textarea
            value={description}
            onChange={e => { setDescription(e.target.value); setErrors(er => ({ ...er, description: '' })) }}
            placeholder="Describe brevemente el problema o inconveniente..."
            rows={4}
            className={`w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green transition-colors resize-none ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
          />
          {errors.description && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{errors.description}</p>}
        </div>

        {/* Photo Picker (Multi-foto obligatoria, 1 a 3 fotos) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <PhotoPicker
            label="Fotografías de la novedad"
            minPhotos={1}
            maxPhotos={3}
            required={true}
            photos={photosList}
            onChange={items => { setPhotosList(items); setErrors(er => ({ ...er, photos: '' })) }}
            error={errors.photos}
          />
        </div>

        {/* Submit */}
        {submitError && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-xs font-medium">
            <AlertCircle size={14} />
            {submitError}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-sena-green text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-green-200 hover:bg-sena-dark active:scale-98 transition-all disabled:opacity-70"
        >
          {submitting ? (
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
            </svg>
          ) : (
            <>
              <Send size={18} />
              Enviar reporte
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-400 pb-8">Tu reporte es completamente anónimo salvo el nombre que indiques.</p>
      </form>
    </div>
  )
}
