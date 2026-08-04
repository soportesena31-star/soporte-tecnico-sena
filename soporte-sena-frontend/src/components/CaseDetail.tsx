import { useState, useRef } from 'react'
import { ChevronLeft, MapPin, Tag, User, Camera, CheckCircle2, AlertTriangle, X, Clock, FileText, UserCheck, ArrowRight, Eye } from 'lucide-react'
import { type Case, PRIORITY_COLORS, formatDate } from '../data/mockData'
import PhotoPicker, { type PhotoItem } from './PhotoPicker'
import { urlFoto } from '../api/client'

interface Props {
  caseData: Case
  techName: string
  onBack: () => void
  onTakeCase: () => Promise<Case>
  onStartWork: () => Promise<Case>
  onResolve: (evidenceFiles: File[], notasResolucion: string) => Promise<Case>
}

type LocalStatus = 'Abierto' | 'Asignado' | 'En proceso' | 'Resuelto'

const STATUS_STEPS: LocalStatus[] = ['Abierto', 'Asignado', 'En proceso', 'Resuelto']

export default function CaseDetail({ caseData, techName, onBack, onTakeCase, onStartWork, onResolve }: Props) {
  const [caso, setCaso] = useState<Case>(caseData)
  const [notasResolucion, setNotasResolucion] = useState('')
  const [evidencePhotosList, setEvidencePhotosList] = useState<PhotoItem[]>([])
  const [resolveError, setResolveError] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info')
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  const status: LocalStatus =
    caso.status === 'Resuelto' || caso.status === 'Cerrado' ? 'Resuelto' :
    caso.status === 'En proceso' ? 'En proceso' :
    caso.status === 'Asignado' ? 'Asignado' : 'Abierto'

  const pc = PRIORITY_COLORS[caso.priority]
  const isHigh = caso.priority === 'Alta'

  const handleTakeCase = async () => {
    setBusy(true)
    try {
      const actualizado = await onTakeCase()
      setCaso(actualizado)
    } finally {
      setBusy(false)
    }
  }

  const handleStartWork = async () => {
    setBusy(true)
    try {
      const actualizado = await onStartWork()
      setCaso(actualizado)
    } finally {
      setBusy(false)
    }
  }

  const handleResolve = async () => {
    if (evidencePhotosList.length === 0) {
      setResolveError('Debes adjuntar al menos 1 fotografía de evidencia para resolver el caso (máximo 5).')
      return
    }
    setResolveError('')
    setBusy(true)
    try {
      const actualizado = await onResolve(evidencePhotosList.map(p => p.file), notasResolucion.trim())
      setCaso(actualizado)
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : 'No se pudo resolver el caso. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const currentStep = STATUS_STEPS.indexOf(status)

  const headerBg =
    status === 'Resuelto' ? 'from-green-600 to-green-700' :
    status === 'En proceso' ? 'from-amber-500 to-amber-600' :
    status === 'Asignado' ? 'from-purple-600 to-purple-700' :
    'from-sena-navy to-[#243550]'

  return (
    <div className="min-h-screen bg-[#F0F2F7] pb-8">
      {/* ── Header ── */}
      <div className={`bg-gradient-to-br ${headerBg} text-white px-4 pt-12 pb-6`}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/60 text-sm mb-4 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Volver a casos
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-white/50 text-xs font-mono">{caso.number}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pc.bg} ${pc.text} flex items-center gap-0.5`}>
                {isHigh && <AlertTriangle size={9} />} {caso.priority}
              </span>
            </div>
            <h1 className="text-base font-bold leading-snug line-clamp-3">{caso.description}</h1>
          </div>
          {status === 'Resuelto' && (
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={22} />
            </div>
          )}
        </div>

        {/* Progress tracker */}
        <div className="flex items-center gap-0 mt-2">
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                  i < currentStep ? 'bg-white border-white text-sena-green' :
                  i === currentStep ? 'bg-white/30 border-white text-white' :
                  'bg-white/10 border-white/30 text-white/40'
                }`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <p className={`text-[9px] mt-1 font-semibold whitespace-nowrap ${i <= currentStep ? 'text-white' : 'text-white/40'}`}>{s}</p>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mt-[-10px] ${i < currentStep ? 'bg-white' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 max-w-lg mx-auto">
        {/* ── Action button ── */}
        {status === 'Abierto' && (
          <div className="mt-4">
            <button onClick={handleTakeCase} disabled={busy} className="w-full bg-sena-green text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-green-200 hover:bg-sena-dark active:scale-[0.98] transition-all disabled:opacity-70">
              <UserCheck size={20} /> {busy ? 'Tomando caso...' : 'Tomar este caso'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">Serás registrado como responsable</p>
          </div>
        )}

        {status === 'Asignado' && (
          <div className="mt-4 space-y-3">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-purple-500 font-semibold uppercase tracking-wider">Responsable asignado</p>
                <p className="font-black text-purple-900">{caso.assignedTo?.name || techName}</p>
                <p className="text-xs text-purple-400">{formatDate(caso.updatedAt)}</p>
              </div>
            </div>
            <button onClick={handleStartWork} disabled={busy} className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-amber-600 active:scale-[0.98] transition-all disabled:opacity-70">
              {busy ? 'Iniciando...' : <>Iniciar trabajo <ArrowRight size={16} /> En proceso</>}
            </button>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mt-4">
          {(['info', 'history'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
              {t === 'info' ? 'Información' : 'Historial'}
            </button>
          ))}
        </div>

        {/* ── INFO TAB ── */}
        {activeTab === 'info' && (
          <div className="mt-4 space-y-3">
            {/* Details card */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
              <InfoRow icon={<MapPin size={13} />} label="Ubicación" value={`${caso.space.name} · ${caso.space.type}`} />
              <InfoRow icon={<Tag size={13} />} label="Categoría" value={caso.category} />
              <InfoRow icon={<User size={13} />} label="Reportado por" value={caso.reportedBy} />
              <InfoRow icon={<Clock size={13} />} label="Creado" value={formatDate(caso.createdAt)} />
              {caso.assignedTo && <InfoRow icon={<UserCheck size={13} />} label="Responsable" value={caso.assignedTo.name} green />}
              <div className="border-t border-gray-50 pt-3">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FileText size={11} /> Descripción</p>
                <p className="text-sm text-gray-700 leading-relaxed">{caso.description}</p>

                {/* Galería de fotos del caso reportado */}
                {((caso.photos && caso.photos.length > 0) || caso.photo) && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Camera size={11} className="text-sena-green" /> Fotografías de la novedad
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(caso.photos && caso.photos.length > 0 ? caso.photos : [caso.photo!]).map((f, idx) => {
                        const src = f.startsWith('http') || f.startsWith('data:') ? f : (urlFoto(f) || f)
                        return (
                          <div
                            key={idx}
                            onClick={() => setViewingPhoto(src)}
                            className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer relative group"
                          >
                            <img src={src} alt={`Foto novedad ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye size={14} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions for En proceso */}
            {status === 'En proceso' && (
              <>
                {/* Evidence PhotoPicker (1 to 5 photos mandatory) */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <PhotoPicker
                    label="Evidencias fotográficas del trabajo"
                    minPhotos={1}
                    maxPhotos={5}
                    required={true}
                    photos={evidencePhotosList}
                    onChange={items => { setEvidencePhotosList(items); setResolveError('') }}
                    error={resolveError}
                  />
                </div>

                {/* Resolution notes */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FileText size={11} /> Notas de resolución <span className="text-gray-300 font-normal normal-case">(opcional)</span>
                  </p>
                  <textarea
                    value={notasResolucion}
                    onChange={e => setNotasResolucion(e.target.value)}
                    placeholder="Describe la solución aplicada, materiales usados, observaciones importantes..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green resize-none transition-colors"
                  />
                </div>

                {/* Resolve error */}
                {resolveError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-medium flex items-start gap-2">
                    <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" /> {resolveError}
                  </div>
                )}

                {/* Resolve CTA */}
                <button
                  onClick={handleResolve}
                  disabled={busy}
                  className="w-full bg-sena-green text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-green-200 hover:bg-sena-dark active:scale-[0.98] transition-all disabled:opacity-70"
                >
                  <CheckCircle2 size={20} /> {busy ? 'Guardando...' : 'Marcar como resuelto'}
                </button>
              </>
            )}

            {/* Resolved state */}
            {status === 'Resuelto' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={28} className="text-green-600" />
                </div>
                <p className="font-black text-green-800 text-lg">¡Caso resuelto!</p>
                <p className="text-sm text-green-600 mt-1">Resuelto por <span className="font-bold">{caso.assignedTo?.name || techName}</span></p>

                {/* Galería de evidencias de resolución */}
                {((caso.evidences && caso.evidences.length > 0) || caso.evidence) && (
                  <div className="mt-4 pt-3 border-t border-green-200/60">
                    <p className="text-xs text-green-700 font-bold mb-2">Evidencias fotográficas del trabajo:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(caso.evidences && caso.evidences.length > 0 ? caso.evidences : [caso.evidence!]).map((ev, idx) => {
                        const src = ev.startsWith('http') || ev.startsWith('data:') ? ev : (urlFoto(ev) || ev)
                        return (
                          <div
                            key={idx}
                            onClick={() => setViewingPhoto(src)}
                            className="aspect-square rounded-xl overflow-hidden border border-green-200 bg-white cursor-pointer relative group"
                          >
                            <img src={src} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye size={14} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="mt-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="space-y-0">
                {caso.timeline.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Sin movimientos todavía.</p>
                ) : caso.timeline.map((ev, i) => {
                  const isLast = i === caso.timeline.length - 1
                  const iconBg =
                    ev.action === 'Caso resuelto' ? 'bg-green-100' :
                    ev.action === 'Caso asignado' ? 'bg-purple-100' :
                    ev.action === 'Nota agregada' ? 'bg-amber-100' : 'bg-gray-100'
                  const iconText =
                    ev.action === 'Caso resuelto' ? 'text-green-600' :
                    ev.action === 'Caso asignado' ? 'text-purple-600' :
                    ev.action === 'Nota agregada' ? 'text-amber-600' : 'text-gray-500'

                  return (
                    <div key={ev.id || i} className="flex gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconText}`}>
                          {ev.action === 'Caso resuelto' ? <CheckCircle2 size={14} /> :
                           ev.action === 'Caso asignado' ? <UserCheck size={14} /> :
                           ev.action === 'Nota agregada' ? <FileText size={14} /> :
                           <Clock size={14} />}
                        </div>
                        {!isLast && <div className="w-0.5 bg-gray-100 flex-1 mt-2" />}
                      </div>
                      <div className={`${!isLast ? 'pb-4' : ''} flex-1`}>
                        <p className="text-[11px] text-gray-400">{formatDate(ev.date)}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{ev.action}</p>
                        {ev.note && (
                          <div className="mt-2 bg-amber-50 rounded-xl px-3 py-2">
                            <p className="text-xs text-amber-800 italic">"{ev.note}"</p>
                          </div>
                        )}
                        <p className="text-xs text-sena-green font-semibold mt-1">{ev.actor}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Lightbox Fullscreen */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative max-w-lg w-full bg-black rounded-3xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setViewingPhoto(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
            >
              <X size={18} />
            </button>
            <img src={viewingPhoto} alt="Imagen" className="w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value, green }: { icon: React.ReactNode; label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div className="flex items-center gap-1.5 text-gray-400 text-[11px] flex-shrink-0 mt-0.5">{icon}<span>{label}</span></div>
      <span className={`text-xs font-semibold text-right leading-snug ${green ? 'text-sena-green' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}
