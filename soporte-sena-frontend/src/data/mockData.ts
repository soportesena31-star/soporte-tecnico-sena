export type CaseStatus = 'Abierto' | 'Asignado' | 'En proceso' | 'Resuelto' | 'Cerrado' | 'Reabierto'
export type Priority = 'Baja' | 'Media' | 'Alta'
export type SpaceType = 'Ambiente' | 'Almacén' | 'Auditorio' | 'Oficina' | 'Zona común' | 'Otro'
export type NoveltyType = 'Equipos de cómputo' | 'Conectividad / Red' | 'Mobiliario' | 'Eléctrico' | 'Audiovisuales' | 'Climatización' | 'Otro'

export interface Space {
  id: string
  name: string
  type: SpaceType
  sede: string
  active: boolean
}

export interface Technician {
  id: string
  name: string
  email: string
  role: 'Técnico' | 'Administrador'
  avatar: string
  casesResolved: number
}

export interface CaseEvent {
  id: string
  date: string
  action: string
  actor: string
  note?: string
}

export interface Case {
  id: string
  number: string
  status: CaseStatus
  priority: Priority
  space: Space
  category: string
  reportedBy: string
  description: string
  createdAt: string
  updatedAt: string
  assignedTo?: Technician
  resolutionTime?: string
  evidence?: string
  evidences?: string[]
  photo?: string
  photos?: string[]
  resolutionNotes?: string
  reopenCount?: number
  timeline: CaseEvent[]
}

export const PRIORITY_DEFAULTS: Record<NoveltyType, Priority> = {
  'Equipos de cómputo': 'Media',
  'Conectividad / Red': 'Media',
  'Mobiliario': 'Baja',
  'Eléctrico': 'Alta',
  'Audiovisuales': 'Media',
  'Climatización': 'Media',
  'Otro': 'Baja',
}

export const NOVELTY_TYPES: NoveltyType[] = [
  'Equipos de cómputo',
  'Conectividad / Red',
  'Mobiliario',
  'Eléctrico',
  'Audiovisuales',
  'Climatización',
  'Otro',
]

export const STATUS_COLORS: Record<CaseStatus, { bg: string; text: string; dot: string }> = {
  'Abierto': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Asignado': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'En proceso': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Resuelto': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'Cerrado': { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  'Reabierto': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
}

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string }> = {
  'Baja': { bg: 'bg-slate-100', text: 'text-slate-600' },
  'Media': { bg: 'bg-orange-50', text: 'text-orange-600' },
  'Alta': { bg: 'bg-red-50', text: 'text-red-600' },
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
