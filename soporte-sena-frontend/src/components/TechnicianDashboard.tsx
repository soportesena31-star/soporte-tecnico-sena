import { useState } from 'react'
import {
  Home, ListChecks, Briefcase, Bell, User,
  MapPin, Tag, Clock, AlertTriangle, ChevronRight,
  CheckCircle2, Zap, TrendingUp, ArrowRight, Star,
  Search, CircleDot, Mail
} from 'lucide-react'
import { STATUS_COLORS, PRIORITY_COLORS, formatDate, type Case } from '../data/mockData'

type Tab = 'home' | 'cases' | 'my-cases' | 'notifications' | 'profile'
type Filter = 'Todos' | 'Nuevos' | 'Alta' | 'Mis casos' | 'En proceso'

interface Props {
  techName: string
  techEmail?: string
  cases: Case[]
  currentTechId: string
  onCaseSelect: (c: Case) => void
  onLogout: () => void
}

const FILTERS: Filter[] = ['Todos', 'Nuevos', 'Alta', 'Mis casos', 'En proceso']

export default function TechnicianDashboard({ techName, techEmail, cases, currentTechId, onCaseSelect, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('home')
  const [filter, setFilter] = useState<Filter>('Todos')
  const [estadoMisCasos, setEstadoMisCasos] = useState<'todos' | 'asignado' | 'en_proceso'>('todos')
  const [search, setSearch] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [readNotifs, setReadNotifs] = useState<string[]>([])

  const firstName = techName.split(' ')[0]
  const initials = techName.split(' ').map(n => n[0]).join('').slice(0, 2)

  const myCases = cases.filter(c => c.assignedTo?.id === currentTechId)
  const openCases = cases.filter(c => c.status === 'Abierto')
  const inProgressCases = cases.filter(c => c.status === 'En proceso' && c.assignedTo?.id === currentTechId)
  const resolvedCount = cases.filter(c => c.status === 'Resuelto' && c.assignedTo?.id === currentTechId).length

  const filteredCases = cases.filter(c => {
    const matchFilter =
      filter === 'Todos' ? true :
      filter === 'Nuevos' ? c.status === 'Abierto' :
      filter === 'Alta' ? c.priority === 'Alta' :
      filter === 'Mis casos' ? c.assignedTo?.id === currentTechId :
      filter === 'En proceso' ? (c.status === 'En proceso' || c.status === 'Asignado') : true
    const matchSearch = !search || c.number.toLowerCase().includes(search.toLowerCase()) ||
      c.space.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  // El tab "Mis casos" lista UNICAMENTE los casos de este tecnico en los
  // estados asignado/en proceso (su cola de trabajo), con filtro por estado.
  const searchMatch = (c: Case) => !search || c.number.toLowerCase().includes(search.toLowerCase()) ||
    c.space.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  const visibleCases = tab === 'my-cases'
    ? myCases
        .filter(c => estadoMisCasos === 'asignado' ? c.status === 'Asignado' : estadoMisCasos === 'en_proceso' ? c.status === 'En proceso' : true)
        .filter(searchMatch)
    : filteredCases

  // Notificaciones derivadas de los casos reales (no hay backend de push todavia,
  // ver README): alta prioridad sin asignar, y casos mios en proceso hace rato.
  const notifications = [
    ...openCases.filter(c => c.priority === 'Alta').map(c => ({
      id: `urgente-${c.id}`,
      title: 'Caso de alta prioridad sin asignar',
      body: `${c.number} — ${c.description.slice(0, 60)}`,
      time: formatDate(c.createdAt),
      unread: true,
      type: 'urgent' as const,
      case: c,
    })),
    ...myCases.filter(c => c.status === 'Asignado').map(c => ({
      id: `asignado-${c.id}`,
      title: 'Caso asignado a ti',
      body: `${c.number} — ${c.space.name}`,
      time: formatDate(c.updatedAt),
      unread: true,
      type: 'assigned' as const,
      case: c,
    })),
  ]
  const unreadCount = notifications.filter(n => !readNotifs.includes(n.id) && n.unread).length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  // Mes actual para mostrar en la tarjeta de rendimiento
  const mesActual = new Date().toLocaleString('es-CO', { month: 'long' })
  const mesCapitalizado = mesActual.charAt(0).toUpperCase() + mesActual.slice(1)

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex flex-col pb-20">

      {/* ── HOME TAB ── */}
      {tab === 'home' && (
        <>
          {/* Header card */}
          <div className="bg-gradient-to-br from-sena-navy via-[#243550] to-[#1a2f45] text-white px-5 pt-14 pb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-white/50 text-xs font-medium">{greeting},</p>
                <h1 className="text-2xl font-black mt-0.5">{firstName} 👋</h1>
                <p className="text-white/40 text-xs mt-1">Técnico de soporte · SENA</p>
              </div>
              <button onClick={() => setProfileOpen(true)} className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-bold text-sm border border-white/20 transition-colors">
                {initials}
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: openCases.length, label: 'Disponibles', accent: 'text-blue-300' },
                { value: myCases.length, label: 'Mis casos', accent: 'text-amber-300' },
                { value: inProgressCases.length, label: 'En proceso', accent: 'text-orange-300' },
                { value: resolvedCount, label: 'Resueltos', accent: 'text-green-300' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center border border-white/10">
                  <p className={`text-2xl font-black ${s.accent}`}>{s.value}</p>
                  <p className="text-[10px] text-white/50 leading-tight mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Priority alert */}
          {openCases.some(c => c.priority === 'Alta') && (
            <div className="mx-4 -mt-3 bg-red-500 text-white rounded-2xl p-3.5 flex items-center gap-3 shadow-lg shadow-red-200">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">Casos de alta prioridad sin atender</p>
                <p className="text-[11px] text-red-100 mt-0.5 truncate">
                  {openCases.filter(c => c.priority === 'Alta').map(c => c.number).join(', ')}
                </p>
              </div>
              <button onClick={() => { setTab('cases'); setFilter('Alta') }} className="flex-shrink-0">
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* My active cases */}
          <div className="px-4 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 text-sm">Mis casos activos</h2>
              <button onClick={() => { setTab('cases'); setFilter('Mis casos') }} className="text-xs text-sena-green font-semibold flex items-center gap-1 hover:underline">
                Ver todos <ChevronRight size={12} />
              </button>
            </div>
            {myCases.filter(c => c.status !== 'Resuelto' && c.status !== 'Cerrado').length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                <CheckCircle2 size={32} className="text-green-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-500">¡Todo al día!</p>
                <p className="text-xs text-gray-400 mt-0.5">No tienes casos pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myCases.filter(c => c.status !== 'Resuelto' && c.status !== 'Cerrado').map(c => (
                  <MiniCaseCard key={c.id} c={c} onClick={() => onCaseSelect(c)} />
                ))}
              </div>
            )}
          </div>

          {/* Available new cases */}
          {openCases.length > 0 && (
            <div className="px-4 mt-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 text-sm">Casos disponibles</h2>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{openCases.length}</span>
              </div>
              <div className="space-y-3">
                {openCases.slice(0, 3).map(c => (
                  <MiniCaseCard key={c.id} c={c} onClick={() => onCaseSelect(c)} showTake />
                ))}
              </div>
            </div>
          )}

          {/* Stats card */}
          <div className="mx-4 mt-5 bg-gradient-to-br from-sena-green to-[#2d8400] rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} />
              <p className="text-xs font-bold uppercase tracking-wider">Tu rendimiento · {mesCapitalizado}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: String(resolvedCount), label: 'Resueltos', icon: CheckCircle2 },
                { value: '—', label: 'Tiempo prom.', icon: Clock },
                { value: '—', label: 'Calificación', icon: Star },
              ].map(s => (
                <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
                  <p className="text-lg font-black">{s.value}</p>
                  <p className="text-[10px] text-green-100 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── CASES TAB ── */}
      {(tab === 'cases' || tab === 'my-cases') && (
        <>
          <div className="bg-sena-navy text-white px-4 pt-12 pb-5">
            <h1 className="text-xl font-black mb-4">
              {tab === 'my-cases' ? 'Mis casos' : 'Todos los casos'}
            </h1>
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por número, espacio..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          {/* Filters: en "Casos" los filtros generales; en "Mis casos" solo
              Todos / Asignados / En proceso, limitados a los casos de este tecnico */}
          {tab === 'my-cases' ? (
            <div className="px-4 py-3 flex gap-2">
              {([
                { id: 'todos', label: 'Todos', count: myCases.length },
                { id: 'asignado', label: 'Asignados', count: myCases.filter(c => c.status === 'Asignado').length },
                { id: 'en_proceso', label: 'En proceso', count: myCases.filter(c => c.status === 'En proceso').length },
              ] as { id: 'todos' | 'asignado' | 'en_proceso'; label: string; count: number }[]).map(f => (
                <button
                  key={f.id}
                  onClick={() => setEstadoMisCasos(f.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    estadoMisCasos === f.id
                      ? 'bg-sena-green text-white shadow-md shadow-green-200'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-sena-green/30'
                  }`}
                >
                  {f.label}
                  {f.count > 0 && (
                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-black ${estadoMisCasos === f.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 overflow-x-auto">
              <div className="flex gap-2 w-max">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      filter === f
                        ? 'bg-sena-green text-white shadow-md shadow-green-200'
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-sena-green/30'
                    }`}
                  >
                    {f}
                    {f === 'Alta' && openCases.filter(c => c.priority === 'Alta').length > 0 && (
                      <span className="ml-1.5 bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5">
                        {cases.filter(c => c.priority === 'Alta').length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cases */}
          <div className="px-4 space-y-3">
            {visibleCases.length === 0 ? (
              <EmptyState message="No hay casos con este filtro" />
            ) : (
              visibleCases.map(c => (
                <FullCaseCard key={c.id} c={c} onClick={() => onCaseSelect(c)} />
              ))
            )}
          </div>
        </>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {tab === 'notifications' && (
        <>
          <div className="bg-sena-navy text-white px-4 pt-12 pb-5">
            <h1 className="text-xl font-black">Notificaciones</h1>
            <p className="text-white/50 text-xs mt-1">{unreadCount} sin leer</p>
          </div>
          <div className="px-4 mt-4 space-y-3">
            {notifications.length === 0 && (
              <div className="text-center py-16">
                <Bell size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Estás al día, no hay avisos pendientes.</p>
              </div>
            )}
            {notifications.map(n => {
              const isRead = readNotifs.includes(n.id) || !n.unread
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    setReadNotifs(prev => [...prev, n.id])
                    onCaseSelect(n.case)
                  }}
                  className={`w-full text-left rounded-2xl p-4 border transition-all ${isRead ? 'bg-white border-gray-100' : 'bg-white border-sena-green/30 shadow-sm shadow-green-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      n.type === 'urgent' ? 'bg-red-100' : n.type === 'assigned' ? 'bg-blue-100' : 'bg-amber-100'
                    }`}>
                      {n.type === 'urgent' ? <Zap size={16} className="text-red-600" /> :
                       n.type === 'assigned' ? <Briefcase size={16} className="text-blue-600" /> :
                       <Clock size={16} className="text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-semibold ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                        {!isRead && <span className="w-2 h-2 bg-sena-green rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[11px] text-gray-400 mt-1.5">{n.time}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-2 pt-2 pb-3 flex items-center justify-around z-50">
        {([
          { id: 'home', icon: Home, label: 'Inicio' },
          { id: 'cases', icon: ListChecks, label: 'Casos' },
          { id: 'my-cases', icon: Briefcase, label: 'Mis casos' },
          { id: 'notifications', icon: Bell, label: 'Avisos', badge: unreadCount },
          { id: 'profile', icon: User, label: 'Perfil' },
        ] as { id: Tab; icon: typeof Home; label: string; badge?: number }[]).map(item => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'profile') { setProfileOpen(true); return }
              setTab(item.id)
              if (item.id === 'my-cases') setFilter('Mis casos')
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              tab === item.id
                ? 'text-sena-green'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="relative">
              <item.icon size={21} strokeWidth={tab === item.id ? 2.5 : 1.8} />
              {item.badge ? (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-black px-0.5">{item.badge}</span>
              ) : null}
            </div>
            <span className={`text-[10px] font-semibold`}>{item.label}</span>
            {tab === item.id && <span className="w-4 h-0.5 bg-sena-green rounded-full" />}
          </button>
        ))}
      </nav>

      {/* ── PROFILE SHEET ── */}
      {profileOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setProfileOpen(false)}>
          <div className="bg-white w-full rounded-t-3xl pb-8 max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-4 mb-6" />

            {/* Profile header */}
            <div className="px-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-sena-green to-sena-dark rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-green-200">
                  {initials}
                </div>
                <div>
                  <p className="font-black text-gray-900 text-lg">{techName}</p>
                  <p className="text-sena-green font-semibold text-sm">Técnico de Soporte</p>
                  <p className="text-gray-400 text-xs mt-1 flex items-center gap-1"><Mail size={10} />{techEmail || 'Sin correo registrado'}</p>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="px-5 mb-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: String(resolvedCount), l: 'Resueltos' },
                  { v: String(myCases.filter(c => c.status !== 'Resuelto' && c.status !== 'Cerrado').length), l: 'En curso' },
                  { v: String(myCases.length), l: 'Total asignados' },
                ].map(s => (
                  <div key={s.l} className="bg-gray-50 rounded-2xl p-3 text-center">
                    <p className="text-xl font-black text-gray-900">{s.v}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 space-y-2">
              <button onClick={() => { setProfileOpen(false); onLogout() }} className="w-full py-3.5 rounded-2xl border-2 border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── MINI CASE CARD (for home screen) ── */
function MiniCaseCard({ c, onClick, showTake }: { c: Case; onClick: () => void; showTake?: boolean }) {
  const sc = STATUS_COLORS[c.status]
  const pc = PRIORITY_COLORS[c.priority]
  const isHighPriority = c.priority === 'Alta'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl overflow-hidden border transition-all hover:shadow-md active:scale-[0.98] ${
        isHighPriority ? 'border-red-200 shadow-sm shadow-red-50' : 'border-gray-100'
      }`}
    >
      {/* Priority bar */}
      <div className={`h-1 w-full ${c.priority === 'Alta' ? 'bg-red-400' : c.priority === 'Media' ? 'bg-amber-400' : 'bg-gray-200'}`} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Category icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isHighPriority ? 'bg-red-50' : 'bg-sena-green/10'}`}>
            <CircleDot size={16} className={isHighPriority ? 'text-red-500' : 'text-sena-green'} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-mono text-gray-400">{c.number}</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {c.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{c.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <MapPin size={10} /> {c.space.name}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Clock size={10} /> {formatDate(c.createdAt).split(',')[0]}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300 mt-1 flex-shrink-0" />
        </div>
        {showTake && (
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pc.bg} ${pc.text}`}>
              {c.priority === 'Alta' && <AlertTriangle size={9} className="inline mr-0.5" />}
              Prioridad {c.priority}
            </span>
            <span className="text-xs text-sena-green font-bold flex items-center gap-1">
              Tomar caso <ArrowRight size={12} />
            </span>
          </div>
        )}
      </div>
    </button>
  )
}

/* ── FULL CASE CARD (for cases list) ── */
function FullCaseCard({ c, onClick }: { c: Case; onClick: () => void }) {
  const sc = STATUS_COLORS[c.status]
  const pc = PRIORITY_COLORS[c.priority]

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-sena-green/20 active:scale-[0.99] transition-all"
    >
      <div className={`h-1 w-full ${c.priority === 'Alta' ? 'bg-red-400' : c.priority === 'Media' ? 'bg-amber-300' : 'bg-gray-200'}`} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-mono font-bold text-gray-400">{c.number}</p>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pc.bg} ${pc.text}`}>
              {c.priority === 'Alta' && <AlertTriangle size={9} className="inline mr-0.5" />}
              {c.priority}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {c.status}
            </span>
          </div>
        </div>

        <p className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug mb-3">{c.description}</p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <InfoPill icon={<MapPin size={10} />} text={c.space.name} />
          <InfoPill icon={<Tag size={10} />} text={c.category} />
          <InfoPill icon={<Clock size={10} />} text={formatDate(c.createdAt).split(',')[0]} />
          {c.assignedTo
            ? <InfoPill icon={<User size={10} />} text={c.assignedTo.name} green />
            : <InfoPill icon={<User size={10} />} text={c.reportedBy} />
          }
        </div>
      </div>
    </button>
  )
}

function InfoPill({ icon, text, green }: { icon: React.ReactNode; text: string; green?: boolean }) {
  return (
    <span className={`flex items-center gap-1 text-[11px] truncate ${green ? 'text-sena-green font-semibold' : 'text-gray-400'}`}>
      {icon} <span className="truncate">{text}</span>
    </span>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
      <CheckCircle2 size={36} className="text-gray-200 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-400">{message}</p>
    </div>
  )
}

