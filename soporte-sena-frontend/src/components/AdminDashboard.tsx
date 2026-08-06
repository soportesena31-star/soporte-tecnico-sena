import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, urlFoto } from '../api/client'
import { mapCaso } from '../api/mappers'
import {
  LayoutDashboard, Ticket, Building2, Users, Tag, BarChart3, History, Settings,
  TrendingUp, Clock, CheckCircle, AlertCircle, RotateCcw, Search, Filter,
  ChevronDown, ChevronUp, Edit2, Download, LogOut, Menu,
  Plus, X, Bell, Shield, QrCode, Trash2, Save, Eye, EyeOff,
  AlertTriangle, UserPlus, Mail, RefreshCw} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import { STATUS_COLORS, PRIORITY_COLORS, formatDate, type Case, type Space } from '../data/mockData'
import ReasignarModal from './ReasignarModal'

type Section = 'dashboard' | 'cases' | 'spaces' | 'technicians' | 'categories' | 'reports' | 'history' | 'settings'

interface Technician { id: string; name: string; email: string; role: string; avatar: string; casesResolved: number; activo?: boolean }
interface Categoria { id: string; name: string; priority: string; count: number }
interface HistorialItem { id: string; time: string; action: string; actor: string; target: string; role: string; type: string }

interface Props {
  onLogout: () => void
  adminName: string
  cases: Case[]
  spaces: Space[]
  technicians: Technician[]
  categories: Categoria[]
  historyLog: HistorialItem[]
  roles: { id: string; nombre: string }[]
  onCreateSpace: (data: { name: string; type: string; sede: string }) => Promise<void>
  onUpdateSpace: (id: string, data: { name: string; type: string; sede: string }) => Promise<void>
  onToggleSpace: (id: string, active: boolean) => Promise<void>
  onInvitar: (data: { email: string; nombre: string; rol_id: string }) => Promise<{ correo_enviado: boolean; motivo?: string }>
  onAssignCase: (caseId: string, tecnicoId: string) => Promise<void>
  onReassignCase: (caseId: string, tecnicoId: string, motivo: string) => Promise<void>
  onEditarTecnico: (id: string, datos: { nombre: string; email: string; especialidad?: string; rol_id: string; activo: boolean }) => Promise<void>
  onCrearCategoria: (datos: { nombre: string; prioridad: string }) => Promise<void>
  onEditarCategoria: (id: string, datos: { nombre: string; prioridad: string }) => Promise<void>
  onEliminarCategoria: (id: string) => Promise<void>
  /** Numero de caso que debe abrirse al entrar al panel (deep link desde push). */
  casoInicial?: string | null
}


const NAV = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'cases', icon: Ticket, label: 'Casos' },
  { id: 'spaces', icon: Building2, label: 'Espacios' },
  { id: 'technicians', icon: Users, label: 'Técnicos' },
  { id: 'categories', icon: Tag, label: 'Categorías' },
  { id: 'reports', icon: BarChart3, label: 'Reportes' },
  { id: 'history', icon: History, label: 'Historial' },
  { id: 'settings', icon: Settings, label: 'Configuración' },
] as const

const CATEGORY_COLORS = ['#39A900', '#2563EB', '#EF4444', '#8B5CF6', '#F59E0B', '#06B6D4', '#9333EA', '#EA580C']

export default function AdminDashboard({ onLogout, adminName, cases, spaces, technicians, categories, historyLog, roles, onCreateSpace, onUpdateSpace, onToggleSpace, onInvitar, onAssignCase, onReassignCase, onEditarTecnico, onCrearCategoria, onEditarCategoria, onEliminarCategoria, casoInicial }: Props) {
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tecnicoFiltro, setTecnicoFiltro] = useState<string | null>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifRead, setNotifRead] = useState(false)
  const notifRef = useRef<HTMLDivElement | null>(null)

  // Deep link desde notificacion: llega un ?caso= en la URL y hay que
  // mostrarlo en la seccion de casos.
  useEffect(() => {
    if (casoInicial) setSection('cases')
  }, [casoInicial])

  const notifs = useMemo(() => historyLog.slice(0, 8), [historyLog])

  useEffect(() => {
    if (!notifOpen) return
    const onDocClick = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [notifOpen])

  const adminInitials = adminName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const resolvedCases = cases.filter(c => ['Resuelto', 'Cerrado'].includes(c.status) && c.createdAt && c.updatedAt)
  const promedioResolucionHoras = resolvedCases.length
    ? resolvedCases.reduce((sum, c) => sum + (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) / 1000 / 60 / 60, 0) / resolvedCases.length
    : null

  const metrics = {
    total: cases.length,
    abiertos: cases.filter(c => c.status === 'Abierto').length,
    enProceso: cases.filter(c => c.status === 'En proceso' || c.status === 'Asignado').length,
    resueltos: cases.filter(c => c.status === 'Resuelto').length,
    cerrados: cases.filter(c => c.status === 'Cerrado').length,
    reabiertos: cases.filter(c => c.status === 'Reabierto').length,
    tiempoPromedio: promedioResolucionHoras !== null ? `${promedioResolucionHoras.toFixed(1)}h` : '—',
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-sena-navy flex flex-col z-50 transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sena-green rounded-xl flex items-center justify-center font-black text-white text-base shadow-lg shadow-green-900/40">S</div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">SENA Soporte TI</p>
              <p className="text-white/40 text-[11px]">Panel Administrativo</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = section === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setSection(item.id as Section); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  active
                    ? 'bg-sena-green text-white shadow-md shadow-green-900/30'
                    : 'text-white/55 hover:text-white hover:bg-white/8'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
                {item.id === 'cases' && metrics.abiertos > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {metrics.abiertos}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sena-green to-sena-dark rounded-lg flex items-center justify-center text-white text-xs font-black">{adminInitials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{adminName}</p>
              <p className="text-white/40 text-[10px]">Administrador</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors">
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Menu size={18} />
            </button>
            <div>
              <h1 className="font-black text-gray-900">{NAV.find(n => n.id === section)?.label}</h1>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                SENA · {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setNotifRead(true); setNotifOpen(v => !v) }} className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell size={18} className="text-gray-500" />
                {!notifRead && notifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">Notificaciones</p>
                    {notifs.length > 0 && <span className="bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{notifs.length}</span>}
                  </div>
                  <ul className="max-h-80 overflow-auto">
                    {notifs.length === 0 ? (
                      <li className="px-4 py-6 text-center text-xs text-gray-400">No hay notificaciones recientes</li>
                    ) : notifs.map(item => (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            if (item.target && item.target !== '—') {
                              setNotifOpen(false)
                              navigate(`/admin?caso=${encodeURIComponent(item.target)}`)
                            } else {
                              setNotifOpen(false)
                            }
                          }}
                          className="w-full text-left px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <p className="text-xs font-semibold text-gray-800 capitalize">{item.action}</p>
                          <p className="text-[11px] text-gray-500 truncate">{item.target !== '—' ? `Caso ${item.target}` : (item.target || item.actor)}</p>
                          <p className="text-[10px] text-gray-400">{item.time}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="w-8 h-8 bg-sena-green rounded-lg flex items-center justify-center text-white text-xs font-black cursor-pointer hover:bg-sena-dark transition-colors">{adminInitials}</div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {section === 'dashboard' && <DashboardSection metrics={metrics} cases={cases} onNavigate={s => setSection(s)} />}
          {section === 'cases' && <CasesSection cases={cases} technicians={technicians} onAssignCase={onAssignCase} onReassignCase={onReassignCase} tecnicoFilter={tecnicoFiltro} onTecnicoFilterChange={setTecnicoFiltro} casoInicial={casoInicial} />}
          {section === 'spaces' && <SpacesSection spaces={spaces} cases={cases} onCreateSpace={onCreateSpace} onUpdateSpace={onUpdateSpace} onToggleSpace={onToggleSpace} />}
          {section === 'technicians' && <TechniciansSection technicians={technicians} cases={cases} roles={roles} onInvitar={onInvitar} onEditarTecnico={onEditarTecnico} onVerCasos={(id) => { setTecnicoFiltro(id); setSection('cases') }} />}
          {section === 'categories' && <CategoriesSection categories={categories} onCrear={onCrearCategoria} onEditar={onEditarCategoria} onEliminar={onEliminarCategoria} />}
          {section === 'reports' && <ReportsSection technicians={technicians} categories={categories} />}
          {section === 'history' && <HistorySection historyLog={historyLog} />}
          {section === 'settings' && <SettingsSection />}
        </div>
      </main>
    </div>
  )
}

/* ══════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════ */
function DashboardSection({ metrics, cases, onNavigate }: { metrics: Record<string, number | string>; cases: Case[]; onNavigate: (s: Section) => void }) {
  const last7Days = useMemo(() => {
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      days.push(date)
    }
    return days
  }, [])

  const weekData = useMemo(() => {
    const createdByDay = new Map<string, number>()
    const resolvedByDay = new Map<string, number>()
    const dayKeys = new Set(last7Days.map((day) => day.toISOString().slice(0, 10)))

    cases.forEach((c) => {
      const created = new Date(c.createdAt)
      const createdKey = created.toISOString().slice(0, 10)
      if (dayKeys.has(createdKey)) {
        createdByDay.set(createdKey, (createdByDay.get(createdKey) || 0) + 1)
      }

      if (['Resuelto', 'Cerrado'].includes(c.status) && c.updatedAt) {
        const resolved = new Date(c.updatedAt)
        const resolvedKey = resolved.toISOString().slice(0, 10)
        if (dayKeys.has(resolvedKey)) {
          resolvedByDay.set(resolvedKey, (resolvedByDay.get(resolvedKey) || 0) + 1)
        }
      }
    })

    return last7Days.map((day) => {
      const key = day.toISOString().slice(0, 10)
      return {
        day: day.toLocaleDateString('es-CO', { weekday: 'short' }),
        reportados: createdByDay.get(key) || 0,
        resueltos: resolvedByDay.get(key) || 0,
      }
    })
  }, [cases, last7Days])

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>()
    cases.forEach((c) => {
      const category = c.category || 'Sin categoría'
      counts.set(category, (counts.get(category) || 0) + 1)
    })
    return Array.from(counts.entries()).map(([name, value], index) => ({
      name,
      value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
  }, [cases])

  const techPerf = useMemo(() => {
    const counts = new Map<string, { name: string; resueltos: number; totalMinutes: number }>()
    cases.forEach((c) => {
      if (!['Resuelto', 'Cerrado'].includes(c.status) || !c.assignedTo?.name) return
      const name = c.assignedTo.name
      const entry = counts.get(name) || { name, resueltos: 0, totalMinutes: 0 }
      entry.resueltos += 1
      const created = new Date(c.createdAt)
      const updated = new Date(c.updatedAt)
      if (!Number.isNaN(created.getTime()) && !Number.isNaN(updated.getTime())) {
        entry.totalMinutes += Math.max(0, (updated.getTime() - created.getTime()) / 60000)
      }
      counts.set(name, entry)
    })
    return Array.from(counts.values())
      .map((entry) => ({
        name: entry.name,
        resueltos: entry.resueltos,
        tiempoPromedio: entry.resueltos ? Number((entry.totalMinutes / entry.resueltos / 60).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.resueltos - a.resueltos)
  }, [cases])

  const maxResolvedTech = Math.max(1, ...techPerf.map((t) => t.resueltos))

  const kpis = [
    { label: 'Total casos', value: metrics.total, icon: Ticket, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    { label: 'Abiertos', value: metrics.abiertos, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'En proceso', value: metrics.enProceso, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Resueltos', value: metrics.resueltos, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { label: 'Cerrados', value: metrics.cerrados, icon: CheckCircle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
    { label: 'Reabiertos', value: metrics.reabiertos, icon: RotateCcw, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { label: 'Tiempo prom.', value: metrics.tiempoPromedio, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  ]

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map(k => (
          <div key={k.label} className={`bg-white rounded-2xl p-4 border ${k.border} shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
              <k.icon size={15} className={k.color} />
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none">{k.value}</p>
            <p className="text-[11px] text-gray-400 mt-1 leading-tight">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Casos esta semana</h3>
              <p className="text-xs text-gray-400 mt-0.5">Reportados vs. resueltos</p>
            </div>
            <span className="text-xs text-sena-green font-semibold bg-green-50 px-2.5 py-1 rounded-full">Semana actual</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gr1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#39A900" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#39A900" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gr2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#86EFAC" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#86EFAC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="reportados" stroke="#39A900" strokeWidth={2.5} fill="url(#gr1)" dot={{ r: 4, fill: '#39A900', strokeWidth: 0 }} name="Reportados" />
              <Area type="monotone" dataKey="resueltos" stroke="#4ADE80" strokeWidth={2} fill="url(#gr2)" dot={{ r: 3, fill: '#4ADE80', strokeWidth: 0 }} name="Resueltos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-1">Por categoría</h3>
          <p className="text-xs text-gray-400 mb-4">Distribución del mes</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {categoryData.slice(0, 4).map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-gray-600">{c.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech performance */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Rendimiento de técnicos</h3>
            <p className="text-xs text-gray-400 mt-0.5">Casos resueltos este mes</p>
          </div>
          <button onClick={() => onNavigate('technicians')} className="text-xs text-sena-green font-semibold hover:underline">Ver todos</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={techPerf} layout="vertical" barSize={14} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={65} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 11 }} />
              <Bar dataKey="resueltos" fill="#39A900" radius={[0, 6, 6, 0]} name="Resueltos" />
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {techPerf.map((t, i) => (
              <div key={t.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${i === 0 ? 'bg-sena-green' : 'bg-sena-navy/70'}`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-semibold text-gray-800">{t.name}</p>
                    <p className="text-xs font-bold text-sena-green">{t.resueltos}</p>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sena-green rounded-full" style={{ width: `${Math.min(100, (t.resueltos / maxResolvedTech) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Tiempo prom. {t.tiempoPromedio}h</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent cases table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Casos recientes</h3>
          <button onClick={() => onNavigate('cases')} className="text-xs text-sena-green font-semibold hover:underline flex items-center gap-1">
            Ver todos <ChevronDown size={11} className="-rotate-90" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <CasesTable cases={[...cases].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, Math.min(20, cases.length))} compact />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   CASES
══════════════════════════════════════════ */
function CasesSection({ cases, technicians, onAssignCase, onReassignCase, tecnicoFilter, onTecnicoFilterChange, casoInicial }: { cases: Case[]; technicians: Technician[]; onAssignCase: Props['onAssignCase']; onReassignCase: Props['onReassignCase']; tecnicoFilter: string | null; onTecnicoFilterChange: (id: string | null) => void; casoInicial?: string | null }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [priorityFilter, setPriorityFilter] = useState('Todas')
  const [sortField, setSortField] = useState<keyof Case>('createdAt')
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage] = useState(1)
  const [verCaso, setVerCaso] = useState<Case | null>(null)
  const PER_PAGE = 20

  const abrirDetalle = (c: Case) => {
    setVerCaso(c)
    // El listado no incluye el historial; se consulta el detalle completo on-demand.
    api.casos.consultar(c.number).then(mapCaso).then((completo) => {
      setVerCaso((actual) => (actual?.id === c.id ? ((completo || c) as Case) : actual))
    }).catch(() => { /* se conserva la vista resumida */ })
  }

  // Deep link desde notificacion: abre el modal del caso indicado una sola vez
  // por valor de ?caso=, cuando el listado ya lo tiene cargado.
  const casoInicialAbierto = useRef<string | null>(null)
  useEffect(() => {
    if (!casoInicial || casoInicialAbierto.current === casoInicial) return
    const caso = cases.find((c) => c.number.toLowerCase() === casoInicial.toLowerCase())
    if (caso) {
      casoInicialAbierto.current = casoInicial
      abrirDetalle(caso)
    }
  }, [casoInicial, cases])

  const filtered = cases.filter(c => {
    const q = search.toLowerCase()
    return (!q || c.number.toLowerCase().includes(q) || c.reportedBy.toLowerCase().includes(q) || c.space.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
      && (statusFilter === 'Todos' || c.status === statusFilter)
      && (priorityFilter === 'Todas' || c.priority === priorityFilter)
      && (!tecnicoFilter || c.assignedTo?.id === tecnicoFilter)
  }).sort((a, b) => {
    const av = String(a[sortField] ?? '')
    const bv = String(b[sortField] ?? '')
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  const pages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const toggleSort = (f: keyof Case) => { if (sortField === f) setSortAsc(v => !v); else { setSortField(f); setSortAsc(false) } }

  return (
    <div className="space-y-4">
      {/* Filtro activo por tecnico (desde "Ver casos") */}
      {tecnicoFilter && (() => {
        const nombre = technicians.find(t => t.id === tecnicoFilter)?.name || 'técnico seleccionado'
        return (
          <div className="flex items-center justify-between bg-sena-green/5 border border-sena-green/20 rounded-2xl px-4 py-2.5">
            <p className="text-xs text-sena-green font-semibold">Mostrando solo casos de <span className="font-black">{nombre}</span></p>
            <button onClick={() => { onTecnicoFilterChange(null); setPage(1) }} className="text-xs font-bold text-sena-green hover:underline flex items-center gap-1"><X size={12} /> Quitar filtro</button>
          </div>
        )
      })()}

      {/* Filters bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar caso, espacio, categoría..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green" />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green">
              {['Todos', 'Abierto', 'Asignado', 'En proceso', 'Resuelto', 'Cerrado'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1) }} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green">
              {['Todas', 'Alta', 'Media', 'Baja'].map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={tecnicoFilter || ''} onChange={e => { onTecnicoFilterChange(e.target.value || null); setPage(1) }} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green">
              <option value="">Todos los técnicos</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-gray-500">{filtered.length} caso{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            {['Todos', 'Abierto', 'En proceso', 'Alta'].map(q => (
              <button key={q} onClick={() => { if (['Abierto', 'En proceso'].includes(q)) setStatusFilter(q); else if (q === 'Alta') setPriorityFilter(q); else { setStatusFilter('Todos'); setPriorityFilter('Todas') }; setPage(1) }}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  (q === statusFilter || (q === 'Alta' && priorityFilter === 'Alta') || (q === 'Todos' && statusFilter === 'Todos' && priorityFilter === 'Todas'))
                    ? 'bg-sena-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <CasesTable cases={paginated} onSort={toggleSort} sortField={sortField} sortAsc={sortAsc} technicians={technicians} onAssign={onAssignCase} onVer={abrirDetalle} />
        </div>
        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Página {page} de {pages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">← Ant.</button>
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${page === i + 1 ? 'bg-sena-green text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Sig. →</button>
            </div>
          </div>
        )}
      </div>

      {verCaso && <VerDetalleCasoModal caso={verCaso} technicians={technicians} onReassignCase={onReassignCase} onClose={() => setVerCaso(null)} />}
    </div>
  )
}

function VerDetalleCasoModal({ caso, technicians, onReassignCase, onClose }: { caso: Case; technicians: Technician[]; onReassignCase: Props['onReassignCase']; onClose: () => void }) {
  const sc = STATUS_COLORS[caso.status]
  const pc = PRIORITY_COLORS[caso.priority]
  const fotos = caso.photos?.length ? caso.photos : caso.photo ? [caso.photo] : []
  const evidencias = caso.evidences?.length ? caso.evidences : caso.evidence ? [caso.evidence] : []
  const [reassignOpen, setReassignOpen] = useState(false)
  const puedeReasignar = !['Resuelto', 'Cerrado'].includes(caso.status)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <p className="font-mono text-base font-black text-gray-900">{caso.number}</p>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${sc.bg} ${sc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} /> {caso.status}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${pc.bg} ${pc.text}`}>{caso.priority}</span>
          </div>
          <div className="flex items-center gap-2">
            {puedeReasignar && (
              <button onClick={() => setReassignOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl px-3 py-2 transition-colors">
                <RefreshCw size={13} /> Reasignar
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Descripcion */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-semibold mb-1">Descripción</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{caso.description}</p>
          </div>

          {/* Data */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Espacio</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{caso.space.name}</p>
              {caso.space.type !== 'Otro' && <p className="text-[11px] text-gray-400">{caso.space.type}</p>}
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Categoría</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{caso.category}</p>
              {caso.space.sede && <p className="text-[11px] text-gray-400">Sede {caso.space.sede}</p>}
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Reportado por</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{caso.reportedBy || '—'}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Creado</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDate(caso.createdAt)}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Asignado a</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{caso.assignedTo?.name || 'Sin asignar'}</p>
            </div>
            {caso.resolutionNotes && (
              <div className="bg-white border border-gray-100 rounded-xl p-3 col-span-2 sm:col-span-1">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Notas de resolución</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5 whitespace-pre-wrap">{caso.resolutionNotes}</p>
              </div>
            )}
          </div>

          {/* Fotos novedad */}
          {fotos.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Fotos de la novedad</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {fotos.map((f, i) => (
                  <a key={i} href={urlFoto(f) ?? undefined} target="_blank" rel="noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img src={urlFoto(f) ?? undefined} alt={`Foto novedad ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Evidencia */}
          {evidencias.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Evidencia de resolución</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {evidencias.map((f, i) => (
                  <a key={i} href={urlFoto(f) ?? undefined} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-green-200 bg-white">
                    <img src={urlFoto(f) ?? undefined} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover aspect-square" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {caso.timeline && caso.timeline.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase mb-3">Historial</p>
              <div className="space-y-3">
                {caso.timeline.map(ev => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-sena-green flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800">{ev.action}</p>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">{formatDate(ev.date)}</span>
                      </div>
                      <p className="text-xs text-gray-500">por <span className="font-semibold text-gray-700">{ev.actor}</span></p>
                      {ev.note && <p className="text-xs text-gray-500 mt-0.5">{ev.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {reassignOpen && (
        <ReasignarModal
          tecnicoActualId={caso.assignedTo?.id}
          tecnicos={technicians.filter(t => t.role === 'Técnico').map(t => ({ id: t.id, nombre: t.name }))}
          onClose={() => setReassignOpen(false)}
          onConfirm={async (tecnicoId, motivo) => {
            await onReassignCase(caso.id, tecnicoId, motivo)
          }}
        />
      )}
    </div>
  )
}

function CasesTable({ cases, compact, onSort, sortField, sortAsc, technicians, onAssign, onVer }: {
  cases: Case[]; compact?: boolean; onSort?: (f: keyof Case) => void; sortField?: keyof Case; sortAsc?: boolean
  technicians?: Technician[]; onAssign?: (caseId: string, tecnicoId: string) => Promise<void>
  onVer?: (caso: Case) => void
}) {
  const cols = [
    { label: 'Caso', field: 'number' as keyof Case },
    { label: 'Fecha', field: 'createdAt' as keyof Case },
    { label: 'Espacio', field: 'space' as keyof Case },
    { label: 'Categoría', field: 'category' as keyof Case },
    { label: 'Prioridad', field: 'priority' as keyof Case },
    { label: 'Técnico', field: 'assignedTo' as keyof Case },
    { label: 'Estado', field: 'status' as keyof Case },
  ]

  // Virtual scroll config
  const rowHeight = compact ? 56 : 64
  const [containerHeight, setContainerHeight] = useState(() => Math.min(720, Math.max(300, typeof window !== 'undefined' ? window.innerHeight - 260 : 600)))
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)

  useEffect(() => {
    function onResize() {
      setContainerHeight(Math.min(720, Math.max(300, window.innerHeight - 260)))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop)

  const total = cases.length
  const visibleCount = Math.min(total, Math.ceil(containerHeight / rowHeight) + 6)
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 3)
  const endIndex = Math.min(total, startIndex + visibleCount)
  const topPadding = startIndex * rowHeight
  const bottomPadding = Math.max(0, (total - endIndex) * rowHeight)

  const visible = cases.slice(startIndex, endIndex)
  const colsCount = cols.length + (compact ? 0 : 1)

  return (
    <div className="w-full">
      <div className="overflow-auto rounded-md border border-gray-100" style={{ height: containerHeight }} ref={containerRef} onScroll={onScroll}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              {cols.map(col => (
                <th key={col.label} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  <button className="flex items-center gap-1 hover:text-gray-700 transition-colors" onClick={() => onSort?.(col.field)}>
                    {col.label}
                    {onSort && (sortField === col.field ? (sortAsc ? <ChevronUp size={11} /> : <ChevronDown size={11} />) : <ChevronDown size={11} className="opacity-25" />)}
                  </button>
                </th>
              ))}
              {!compact && <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 relative">
            {topPadding > 0 && (
              <tr style={{ height: topPadding }}>
                <td colSpan={colsCount} />
              </tr>
            )}

            {visible.map(c => {
              const sc = STATUS_COLORS[c.status]
              const pc = PRIORITY_COLORS[c.priority]
              return (
                <tr key={c.id} className="hover:bg-sena-green/[0.02] transition-colors group" style={{ height: rowHeight }}>
                  <td className="px-4 py-3.5">
                    <p className="font-mono text-xs font-bold text-gray-700">{c.number}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 max-w-[160px] truncate">{c.description}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(c.createdAt).split(',')[0]}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-700 whitespace-nowrap">{c.space.name}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">{c.category}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 w-fit ${pc.bg} ${pc.text}`}>
                      {c.priority === 'Alta' && <AlertTriangle size={9} />} {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">
                    {onAssign && technicians && !['Resuelto', 'Cerrado'].includes(c.status) ? (
                      <AssignSelect caso={c} technicians={technicians} onAssign={onAssign} />
                    ) : (
                      c.assignedTo?.name || <span className="text-gray-300 italic">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} /> {c.status}
                    </span>
                  </td>
                  {!compact && (
                    <td className="px-4 py-3.5">
                      <button onClick={() => onVer?.(c)} className="text-xs text-sena-green font-bold hover:underline">Ver →</button>
                    </td>
                  )}
                </tr>
              )
            })}

            {bottomPadding > 0 && (
              <tr style={{ height: bottomPadding }}>
                <td colSpan={colsCount} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AssignSelect({ caso, technicians, onAssign }: {
  caso: Case; technicians: Technician[]; onAssign: (caseId: string, tecnicoId: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [success, setSuccess] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const tecnicos = technicians.filter(t => t.role === 'Técnico')

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const filtered = tecnicos.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))

  const handleAssign = async (tecnicoId: string) => {
    setLoading(true)
    setError('')
    try {
      await onAssign(caso.id, tecnicoId)
      setSuccess(true)
      setOpen(false)
      setTimeout(() => setSuccess(false), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo asignar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={ref} onClick={e => e.stopPropagation()} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className="flex items-center gap-2 text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white hover:shadow-sm"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-sena-green border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <div className="w-6 h-6 rounded-md bg-sena-navy/10 text-xs font-bold flex items-center justify-center text-sena-green">{caso.assignedTo?.avatar || (caso.assignedTo?.name || '').slice(0,2)}</div>
            <span className="text-xs text-gray-700">{caso.assignedTo?.name || 'Sin asignar'}</span>
          </>
        )}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-50">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar técnico..." className="w-full px-3 py-2 rounded-lg border border-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-sena-green/20" />
          <div className="max-h-48 overflow-auto mt-2">
            <button onClick={() => handleAssign('')} className="w-full text-left px-2 py-2 rounded-md hover:bg-gray-50 text-xs flex items-center gap-2">Sin asignar</button>
            {filtered.map(t => (
              <button key={t.id} onClick={() => handleAssign(t.id)} className="w-full text-left px-2 py-2 rounded-md hover:bg-gray-50 text-xs flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-sena-navy/10 flex items-center justify-center font-black text-sm text-sena-green">{t.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800">{t.name}</div>
                  <div className="text-[10px] text-gray-400">{t.email}</div>
                </div>
                {loading ? <div className="w-4 h-4 border-2 border-sena-green border-t-transparent rounded-full animate-spin" /> : null}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-xs text-gray-400 p-2">No se encontraron técnicos</p>}
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      )}

      {success && <div className="text-[11px] text-green-600 mt-1">Asignado</div>}
    </div>
  )
}

/* ══════════════════════════════════════════
   SPACES
══════════════════════════════════════════ */
function SpacesSection({ spaces, cases, onCreateSpace, onUpdateSpace }: { spaces: Space[]; cases: Case[]; onCreateSpace: Props['onCreateSpace']; onUpdateSpace: Props['onUpdateSpace']; onToggleSpace: Props['onToggleSpace'] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('Ambiente')
  const [newSede, setNewSede] = useState('CEET')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Space | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('Ambiente')
  const [editSede, setEditSede] = useState('CEET')
  const [savingEdit, setSavingEdit] = useState(false)

  const filtered = spaces.filter(s =>
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.sede.toLowerCase().includes(search.toLowerCase()))
    && (typeFilter === 'Todos' || s.type === typeFilter)
  )

  const openEdit = (s: Space) => {
    setEditing(s)
    setEditName(s.name)
    setEditType(s.type)
    setEditSede(s.sede)
  }

  const saveEdit = async () => {
    if (!editing || !editName.trim()) return
    setSavingEdit(true)
    try {
      await onUpdateSpace(editing.id, { name: editName, type: editType, sede: editSede })
      setEditing(null)
    } finally {
      setSavingEdit(false)
    }
  }

  const addSpace = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await onCreateSpace({ name: newName, type: newType, sede: newSede })
      setNewName(''); setNewType('Ambiente'); setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  const typeCount: Record<string, number> = {}
  spaces.forEach(s => { typeCount[s.type] = (typeCount[s.type] || 0) + 1 })

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {['Ambiente', 'Almacén', 'Auditorio', 'Oficina', 'Zona común', 'Otro'].map(t => (
          <button key={t} onClick={() => setTypeFilter(typeFilter === t ? 'Todos' : t)}
            className={`bg-white rounded-xl p-3 border text-center transition-all hover:shadow-md ${typeFilter === t ? 'border-sena-green shadow-sm' : 'border-gray-100'}`}>
            <p className={`text-2xl font-black ${typeFilter === t ? 'text-sena-green' : 'text-gray-900'}`}>{typeCount[t] || 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{t}s</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar espacio o sede..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sena-green/20">
            {['Todos', 'Ambiente', 'Almacén', 'Auditorio', 'Oficina', 'Zona común', 'Otro'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-sena-green text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-sena-dark transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-md shadow-green-200">
          <Plus size={15} /> Nuevo espacio
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">{filtered.length} espacio{filtered.length !== 1 ? 's' : ''}</p>
          <p className="text-xs text-sena-green font-semibold">{spaces.filter(s => s.active).length} activos</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nombre</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tipo</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sede</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Casos</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => {
              const casesInSpace = cases.filter(c => c.space.id === s.id).length
              return (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-3.5 font-semibold text-gray-900 text-sm">{s.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full bg-sena-green/10 text-sena-green text-[11px] font-bold">{s.type}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{s.sede}</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">{casesInSpace}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${s.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {s.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => openEdit(s)} className="text-gray-400 hover:text-sena-green transition-colors" aria-label={`Editar ${s.name}`}>
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">Nuevo espacio</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <FormField label="Nombre del espacio">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Aula 301" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-sena-green" />
              </FormField>
              <FormField label="Tipo">
                <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm bg-white focus:outline-none focus:border-sena-green">
                  {['Ambiente', 'Almacén', 'Auditorio', 'Oficina', 'Zona común', 'Otro'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Sede">
                <select value={newSede} onChange={e => setNewSede(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm bg-white focus:outline-none focus:border-sena-green">
                  {['CEET', 'CMM', 'CMTC', 'CME'].map(s => <option key={s}>{s}</option>)}
                </select>
              </FormField>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)} disabled={saving} className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={addSpace} disabled={saving} className="flex-1 py-3 rounded-xl bg-sena-green text-white text-sm font-bold hover:bg-sena-dark shadow-md shadow-green-200 disabled:opacity-70">{saving ? 'Creando...' : 'Crear espacio'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">Editar espacio</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <FormField label="Nombre del espacio">
                <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Ej: Ambiente 301" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-sena-green" />
              </FormField>
              <FormField label="Tipo">
                <select value={editType} onChange={e => setEditType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm bg-white focus:outline-none focus:border-sena-green">
                  {['Ambiente', 'Almacén', 'Auditorio', 'Oficina', 'Zona común', 'Otro'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Sede">
                <select value={editSede} onChange={e => setEditSede(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm bg-white focus:outline-none focus:border-sena-green">
                  {['CEET', 'CMM', 'CMTC', 'CME'].map(s => <option key={s}>{s}</option>)}
                </select>
              </FormField>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditing(null)} disabled={savingEdit} className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={saveEdit} disabled={savingEdit} className="flex-1 py-3 rounded-xl bg-sena-green text-white text-sm font-bold hover:bg-sena-dark shadow-md shadow-green-200 disabled:opacity-70">{savingEdit ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   TECHNICIANS
══════════════════════════════════════════ */
function TechniciansSection({ technicians, cases, roles, onInvitar, onEditarTecnico, onVerCasos }: {
  technicians: Technician[]; cases: Case[]; roles: { id: string; nombre: string }[]
  onInvitar: (data: { email: string; nombre: string; rol_id: string }) => Promise<{ correo_enviado: boolean; motivo?: string }>
  onEditarTecnico: (id: string, datos: { nombre: string; email: string; especialidad?: string; rol_id: string; activo: boolean }) => Promise<void>
  onVerCasos: (id: string) => void
}) {
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteNombre, setInviteNombre] = useState('')
  const [inviteRolId, setInviteRolId] = useState(roles[0]?.id || '')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ correo_enviado: boolean; motivo?: string } | null>(null)
  const [error, setError] = useState('')

  const [editando, setEditando] = useState<Technician | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editEspecialidad, setEditEspecialidad] = useState('')
  const [editRolId, setEditRolId] = useState('')
  const [editActivo, setEditActivo] = useState(true)
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  const [editError, setEditError] = useState('')

  const abrirEdicion = (t: Technician) => {
    setEditando(t)
    setEditNombre(t.name)
    setEditEmail(t.email)
    setEditEspecialidad('')
    setEditRolId(String(roles.find(r => r.nombre.toLowerCase() === t.role.toLowerCase())?.id || roles[0]?.id || ''))
    setEditActivo(t.activo !== false)
    setEditError('')
  }

  const guardarEdicion = async () => {
    if (!editando) return
    if (!editNombre.trim() || !editEmail.trim()) { setEditError('Completa nombre y correo'); return }
    setEditError(''); setGuardandoEdit(true)
    try {
      await onEditarTecnico(editando.id, {
        nombre: editNombre.trim(),
        email: editEmail.trim(),
        especialidad: editEspecialidad.trim() || undefined,
        rol_id: editRolId,
        activo: editActivo,
      })
      setEditando(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'No se pudo actualizar')
    } finally {
      setGuardandoEdit(false)
    }
  }

  const cerrarModal = () => {
    setShowInvite(false)
    setInviteEmail(''); setInviteNombre(''); setResultado(null); setError('')
  }

  const enviarInvitacion = async () => {
    if (!inviteEmail.trim() || !inviteNombre.trim() || !inviteRolId) { setError('Completa correo, nombre y rol'); return }
    setError(''); setEnviando(true)
    try {
      const r = await onInvitar({ email: inviteEmail, nombre: inviteNombre, rol_id: inviteRolId })
      setResultado(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la invitación')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowInvite(true)} className="bg-sena-green text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-sena-dark flex items-center gap-2 shadow-md shadow-green-200 transition-colors">
          <UserPlus size={15} /> Invitar técnico
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {technicians.map((t, i) => {
          const activeCases = cases.filter(c => c.assignedTo?.id === t.id && c.status !== 'Resuelto' && c.status !== 'Cerrado').length
          const resolvedCases = cases.filter(c => c.assignedTo?.id === t.id && (c.status === 'Resuelto' || c.status === 'Cerrado')).length

          return (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className={`h-2 ${i === 0 ? 'bg-sena-green' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-purple-500' : 'bg-amber-500'}`} />
              <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md ${
                    i === 0 ? 'bg-sena-green shadow-green-200' : i === 1 ? 'bg-blue-500 shadow-blue-200' : i === 2 ? 'bg-purple-500 shadow-purple-200' : 'bg-amber-500 shadow-amber-200'
                  }`}>
                    {t.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900">{t.name}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${t.role === 'Administrador' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-sena-green'}`}>
                      {t.role}
                    </span>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Mail size={10} />{t.email}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${activeCases > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${activeCases > 0 ? 'bg-amber-400' : 'bg-gray-300'}`} />
                    {activeCases > 0 ? 'Activo' : 'Disponible'}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Total resueltos', value: t.casesResolved },
                    { label: 'Activos', value: activeCases },
                    { label: 'Este mes', value: resolvedCases },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-black text-gray-900">{s.value}</p>
                      <p className="text-[10px] text-gray-400 leading-tight">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Performance bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                    <span>Casos resueltos</span>
                    <span className="font-semibold text-sena-green">{t.casesResolved}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sena-green rounded-full transition-all" style={{ width: `${Math.min(100, (t.casesResolved / Math.max(1, ...technicians.map(x => x.casesResolved))) * 100)}%` }} />
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                  <button onClick={() => abrirEdicion(t)} className="flex-1 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-600 transition-colors flex items-center justify-center gap-1.5">
                    <Edit2 size={12} /> Editar
                  </button>
                  <button onClick={() => onVerCasos(t.id)} className="flex-1 py-2 rounded-xl bg-sena-green/10 hover:bg-sena-green/20 text-xs font-semibold text-sena-green transition-colors flex items-center justify-center gap-1.5">
                    <Eye size={12} /> Ver casos
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={cerrarModal}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">Invitar técnico</h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            {resultado ? (
              <div className="text-center py-2">
                <CheckCircle size={36} className={resultado.correo_enviado ? 'text-sena-green mx-auto mb-3' : 'text-amber-500 mx-auto mb-3'} />
                {resultado.correo_enviado ? (
                  <p className="text-sm text-gray-700">Invitación enviada a <span className="font-semibold">{inviteEmail}</span>.</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 font-semibold">La invitación se creó, pero el correo no se pudo enviar.</p>
                    <p className="text-xs text-gray-400 mt-1">{resultado.motivo}</p>
                  </>
                )}
                <button onClick={cerrarModal} className="w-full mt-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200">Cerrar</button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <FormField label="Nombre completo">
                    <input type="text" value={inviteNombre} onChange={e => setInviteNombre(e.target.value)} placeholder="Nombre y apellido" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-sena-green" />
                  </FormField>
                  <FormField label="Correo electrónico">
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="nombre@sena.edu.co" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-sena-green" />
                  </FormField>
                  <FormField label="Rol">
                    <select value={inviteRolId} onChange={e => setInviteRolId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm bg-white focus:outline-none focus:border-sena-green">
                      {roles.map(r => <option key={r.id} value={r.id}>{r.nombre === 'administrador' ? 'Administrador' : 'Técnico'}</option>)}
                    </select>
                  </FormField>
                </div>
                {error && <p className="text-xs text-red-600 font-medium mt-3">{error}</p>}
                <button onClick={enviarInvitacion} disabled={enviando} className="w-full mt-5 py-3.5 rounded-xl bg-sena-green text-white font-bold text-sm hover:bg-sena-dark shadow-md shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-70">
                  <Mail size={15} /> {enviando ? 'Enviando...' : 'Enviar invitación'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">Editar técnico</h3>
              <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <FormField label="Nombre">
                <input value={editNombre} onChange={e => setEditNombre(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-sena-green" />
              </FormField>
              <FormField label="Correo electrónico">
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-sena-green" />
              </FormField>
              <FormField label="Especialidad">
                <input value={editEspecialidad} onChange={e => setEditEspecialidad(e.target.value)} placeholder="Opcional" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-sena-green" />
              </FormField>
              <FormField label="Rol">
                <select value={editRolId} onChange={e => setEditRolId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm bg-white focus:outline-none focus:border-sena-green">
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre === 'administrador' ? 'Administrador' : 'Técnico'}</option>)}
                </select>
              </FormField>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-semibold text-gray-800">Cuenta activa</span>
                <button type="button" onClick={() => setEditActivo(v => !v)} className={`w-11 h-6 rounded-full transition-colors relative ${editActivo ? 'bg-sena-green' : 'bg-gray-200'}`}>
                  <div className="bg-white rounded-full shadow absolute top-0.5 transition-all" style={{ left: editActivo ? '1.35rem' : '0.125rem', width: '1.1rem', height: '1.1rem' }} />
                </button>
              </div>
            </div>
            {editError && <p className="text-xs text-red-500 mt-3">{editError}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditando(null)} disabled={guardandoEdit} className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button onClick={guardarEdicion} disabled={guardandoEdit} className="flex-1 py-3 rounded-xl bg-sena-green text-white text-sm font-bold hover:bg-sena-dark shadow-md shadow-green-200 disabled:opacity-70">{guardandoEdit ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   CATEGORIES
══════════════════════════════════════════ */
function CategoriesSection({ categories, onCrear, onEditar, onEliminar }: {
  categories: Categoria[]
  onCrear: (datos: { nombre: string; prioridad: string }) => Promise<void>
  onEditar: (id: string, datos: { nombre: string; prioridad: string }) => Promise<void>
  onEliminar: (id: string) => Promise<void>
}) {
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [priority, setPriority] = useState('Media')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const openNew = () => { setEditId(null); setName(''); setPriority('Media'); setError(''); setShowModal(true) }
  const openEdit = (c: Categoria) => { setEditId(c.id); setName(c.name); setPriority(c.priority); setError(''); setShowModal(true) }

  const save = async () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError('')
    try {
      if (editId) await onEditar(editId, { nombre: name.trim(), prioridad: priority })
      else await onCrear({ nombre: name.trim(), prioridad: priority })
      setShowModal(false)
    } catch (err) {
      setError((err instanceof Error ? err.message : '') || 'No se pudo guardar la categoría')
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (c: Categoria) => {
    if (!window.confirm(`¿Eliminar la categoría "${c.name}"?`)) return
    setDeleting(c.id)
    setError('')
    try {
      await onEliminar(c.id)
    } catch (err) {
      setError((err instanceof Error ? err.message : '') || 'No se pudo eliminar la categoría')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs">{error}</div>
      ) : null}

      <div className="flex justify-end">
        <button onClick={openNew} className="bg-sena-green text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-sena-dark flex items-center gap-2 shadow-md shadow-green-200 transition-colors">
          <Plus size={15} /> Nueva categoría
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50">
          <p className="text-xs text-gray-400">{categories.length} categorías</p>
        </div>
        <div className="divide-y divide-gray-50">
          {categories.map(c => {
            const pc = PRIORITY_COLORS[c.priority as keyof typeof PRIORITY_COLORS] || { bg: 'bg-gray-100', text: 'text-gray-600' }
            return (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors group">
                <div className="w-10 h-10 bg-sena-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Tag size={16} className="text-sena-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pc.bg} ${pc.text}`}>Prioridad {c.priority}</span>
                    <span className="text-[11px] text-gray-400">{c.count} casos registrados</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-sena-green p-1.5 rounded-lg hover:bg-green-50 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => eliminar(c)} disabled={deleting === c.id} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                    {deleting === c.id ? <AlertCircle size={14} className="animate-pulse" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            )
          })}
          {categories.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">Aún no hay categorías.</div>
          ) : null}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">{editId ? 'Editar categoría' : 'Nueva categoría'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <FormField label="Nombre">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Climatización" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-sena-green" />
              </FormField>
              <FormField label="Prioridad por defecto">
                <div className="grid grid-cols-3 gap-2">
                  {['Baja', 'Media', 'Alta'].map(p => (
                    <button key={p} type="button" onClick={() => setPriority(p)}
                      className={`py-2 rounded-xl text-xs font-bold border-2 transition-colors ${priority === p ? 'border-sena-green bg-sena-green text-white' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </FormField>
              {error ? <p className="text-xs text-red-500">{error}</p> : null}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)} disabled={saving} className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-sm font-semibold text-gray-600 disabled:opacity-50">Cancelar</button>
              <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl bg-sena-green text-white text-sm font-bold hover:bg-sena-dark flex items-center justify-center gap-1.5 disabled:opacity-70">
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   REPORTS
══════════════════════════════════════════ */
function ReportsSection({ technicians, categories }: { technicians: Technician[]; categories: Categoria[] }) {
  const [dateFrom, setDateFrom] = useState(() => {
    const today = new Date()
    const from = new Date(today)
    from.setDate(today.getDate() - 14)
    return from.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [techFilter, setTechFilter] = useState('Todos')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [catFilter, setCatFilter] = useState('Todos')
  const [report, setReport] = useState<{ casos: any[] } | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportError, setReportError] = useState('')
  const [showAllTech, setShowAllTech] = useState(false)

  const reportCases = useMemo(() => {
    if (!report?.casos) return []
    return report.casos.map(mapCaso).filter((c): c is Case => c !== null)
  }, [report])

  const applyQuickRange = (range: string) => {
    const today = new Date()
    const from = new Date(today)
    if (range === '15 días') {
      from.setDate(today.getDate() - 14)
    } else if (range === '30 días') {
      from.setDate(today.getDate() - 29)
    } else if (range === 'Este mes') {
      from.setDate(1)
    }
    setDateFrom(from.toISOString().slice(0, 10))
    setDateTo(today.toISOString().slice(0, 10))
  }

  const mapStatusFilter = (status: string) => {
    if (statusFilter === 'Todos') return true
    if (statusFilter === 'En proceso') return ['Asignado', 'En proceso'].includes(status)
    return status === statusFilter
  }

  const filteredCases = useMemo(() => {
    return reportCases.filter((c) => {
      if (techFilter !== 'Todos' && c.assignedTo?.name !== techFilter) return false
      if (catFilter !== 'Todos' && c.category !== catFilter) return false
      if (!mapStatusFilter(c.status || '')) return false
      return true
    })
  }, [reportCases, techFilter, catFilter, statusFilter])

  const dateKey = (value: string) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString().slice(0, 10)
  }

  const buildDateRange = (from: string, to: string) => {
    const start = new Date(`${from}T00:00:00`)
    const end = new Date(`${to}T23:59:59`)
    const days = []
    for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
      days.push(new Date(current))
    }
    return days
  }

  const reportSeries = useMemo(() => {
    if (!reportCases.length) return []
    const createdCounts = new Map()
    const resolvedCounts = new Map()

    filteredCases.forEach((c) => {
      const createdKey = dateKey(c.createdAt)
      if (createdKey) createdCounts.set(createdKey, (createdCounts.get(createdKey) || 0) + 1)

      const resolvedKey = dateKey(c.resolutionTime || c.updatedAt)
      if (resolvedKey && ['Resuelto', 'Cerrado'].includes(c.status)) {
        resolvedCounts.set(resolvedKey, (resolvedCounts.get(resolvedKey) || 0) + 1)
      }
    })

    return buildDateRange(dateFrom, dateTo).map((d) => {
      const key = d.toISOString().slice(0, 10)
      return {
        day: d.toLocaleDateString('es-CO', { weekday: 'short' }),
        dia: String(d.getDate()),
        reportados: createdCounts.get(key) || 0,
        resueltos: resolvedCounts.get(key) || 0,
      }
    })
  }, [filteredCases, dateFrom, dateTo, report])

  const categoryData = useMemo(() => {
    if (!reportCases.length) return []
    const counts = new Map()
    filteredCases.forEach((c) => {
      const name = c.category || 'Sin categoría'
      counts.set(name, (counts.get(name) || 0) + 1)
    })
    return Array.from(counts.entries()).map(([name, value], index) => ({
      name,
      value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
  }, [filteredCases])

  const techPerf = useMemo(() => {
    if (!reportCases.length) return []
    const groups = new Map()

    filteredCases.forEach((c) => {
      if (!['Resuelto', 'Cerrado'].includes(c.status)) return
      const name = c.assignedTo?.name || 'Sin técnico'
      const entry = groups.get(name) || { name, resueltos: 0, totalMinutes: 0 }
      entry.resueltos += 1
      const start = new Date(c.createdAt)
      const end = new Date(c.resolutionTime || c.updatedAt || c.createdAt)
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        entry.totalMinutes += Math.max(0, (end.getTime() - start.getTime()) / 60000)
      }
      groups.set(name, entry)
    })

    return Array.from(groups.values())
      .map((entry) => ({
        name: entry.name,
        resueltos: entry.resueltos,
        tiempoPromedio: entry.resueltos ? Number((entry.totalMinutes / entry.resueltos / 60).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.resueltos - a.resueltos)
  }, [filteredCases])

  const reportSummary = useMemo(() => {
    const total = filteredCases.length
    const resolved = filteredCases.filter((c) => ['Resuelto', 'Cerrado'].includes(c.status)).length
    const totalMinutes = filteredCases.reduce((sum, c) => {
      if (!['Resuelto', 'Cerrado'].includes(c.status)) return sum
      const start = new Date(c.createdAt)
      const end = new Date(c.resolutionTime || c.updatedAt || c.createdAt)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return sum
      return sum + Math.max(0, (end.getTime() - start.getTime()) / 60000)
    }, 0)
    const avgHours = resolved ? (totalMinutes / resolved / 60) : null
    return {
      total,
      resolved,
      avgTime: avgHours !== null ? `${avgHours.toFixed(1)}h` : '—',
      resolutionRate: total ? `${Math.round((resolved / total) * 100)}%` : '—',
    }
  }, [filteredCases])

  const cargarReporte = useCallback(async () => {
    setLoadingReport(true)
    setReportError('')
    try {
      const reportData = await api.reportes.generar(dateFrom, dateTo)
      setReport(reportData)
    } catch (err) {
      setReportError((err instanceof Error ? err.message : '') || 'No se pudo cargar el reporte')
      setReport(null)
    } finally {
      setLoadingReport(false)
    }
  }, [dateFrom, dateTo])

  const [downloading, setDownloading] = useState<string | null>(null)

  const descargar = async (formato: string) => {
    if (downloading) return
    setDownloading(formato)
    setReportError('')
    try {
      const blob = await api.reportes.descargar(dateFrom, dateTo, formato)
      const ext = formato === 'excel' ? 'xlsx' : 'pdf'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-soporte-sena-${dateFrom}-${dateTo}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setReportError((err instanceof Error ? err.message : '') || 'No se pudo descargar el reporte')
    } finally {
      setDownloading(null)
    }
  }

  useEffect(() => {
    cargarReporte()
  }, [cargarReporte])

  return (
    <div className="space-y-5">
      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <Filter size={15} className="text-sena-green" /> Parámetros del reporte
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <FormField label="Fecha inicio">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-sena-green" />
          </FormField>
          <FormField label="Fecha fin">
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-sena-green" />
          </FormField>
          <FormField label="Técnico">
            <select value={techFilter} onChange={e => setTechFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-sena-green">
              <option>Todos</option>
              {technicians.map(t => <option key={t.id}>{t.name}</option>)}
            </select>
          </FormField>
          <FormField label="Estado">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-sena-green">
              {['Todos', 'Abierto', 'En proceso', 'Resuelto', 'Cerrado'].map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Categoría">
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-sena-green">
              <option>Todos</option>
              {categories.map(c => <option key={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <div className="flex flex-col justify-end">
            <button onClick={cargarReporte} disabled={loadingReport} className="w-full bg-sena-green text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-sena-dark transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70">
              <BarChart3 size={13} /> {loadingReport ? 'Cargando...' : 'Generar'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-gray-400">Acceso rápido:</p>
          {['15 días', '30 días', 'Este mes'].map(q => (
            <button key={q} onClick={() => applyQuickRange(q)} className="text-xs text-sena-green font-semibold hover:underline">{q}</button>
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={() => descargar('excel')} disabled={downloading === 'excel'} className="flex items-center gap-1.5 text-xs text-green-700 font-bold bg-green-50 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-60">
              <Download size={12} /> {downloading === 'excel' ? 'Generando...' : 'Excel'}
            </button>
            <button onClick={() => descargar('pdf')} disabled={downloading === 'pdf'} className="flex items-center gap-1.5 text-xs text-red-600 font-bold bg-red-50 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-60">
              <Download size={12} /> {downloading === 'pdf' ? 'Generando...' : 'PDF'}
            </button>
          </div>
        </div>
      </div>

      {reportError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs">{reportError}</div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total casos', value: reportSummary.total },
          { label: 'Resueltos', value: reportSummary.resolved },
          { label: 'Tiempo prom.', value: reportSummary.avgTime },
          { label: 'Tasa resolución', value: reportSummary.resolutionRate },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-black text-gray-900">{m.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Evolución de casos</h3>
              <p className="text-xs text-gray-400 mt-0.5">Casos reportados y resueltos en el período seleccionado</p>
            </div>
            <span className="text-xs text-sena-green font-semibold bg-green-50 px-2.5 py-1 rounded-full">{dateFrom} – {dateTo}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={reportSeries} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="grm1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#39A900" stopOpacity={0.2} /><stop offset="95%" stopColor="#39A900" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grm2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.15} /><stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="reportados" stroke="#39A900" strokeWidth={2} fill="url(#grm1)" name="Reportados" dot={false} />
              <Area type="monotone" dataKey="resueltos" stroke="#4ADE80" strokeWidth={2} fill="url(#grm2)" name="Resueltos" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-1">Por categoría</h3>
          <p className="text-xs text-gray-400 mb-4">Distribución de la selección actual</p>
          {categoryData.length === 0 ? (
            <p className="text-xs text-gray-500">No hay datos para la categoría seleccionada.</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-1.5 mt-3">
            {categoryData.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-gray-600">{c.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Rendimiento de técnicos</h3>
            <p className="text-xs text-gray-400 mt-0.5">Casos resueltos por técnico</p>
          </div>
          {techPerf.length > 5 ? (
            <button onClick={() => setShowAllTech(s => !s)} className="text-xs text-sena-green font-semibold hover:underline">
              {showAllTech ? 'Ver menos' : `Ver todos (${techPerf.length})`}
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={showAllTech ? techPerf : techPerf.slice(0, 5)} layout="vertical" barSize={14} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={65} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 11 }} />
              <Bar dataKey="resueltos" fill="#39A900" radius={[0, 6, 6, 0]} name="Resueltos" />
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {(showAllTech ? techPerf : techPerf.slice(0, 5)).map((t, i) => (
              <div key={t.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${i === 0 ? 'bg-sena-green' : 'bg-sena-navy/70'}`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-semibold text-gray-800">{t.name}</p>
                    <p className="text-xs font-bold text-sena-green">{t.resueltos}</p>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sena-green rounded-full" style={{ width: `${Math.min(100, t.resueltos * 5)}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Tiempo prom. {t.tiempoPromedio}h</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">Casos recientes en el reporte</h3>
        </div>
        <div className="overflow-x-auto">
          <CasesTable cases={[...filteredCases].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, Math.min(20, filteredCases.length))} compact />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   HISTORY
══════════════════════════════════════════ */
function HistorySection({ historyLog }: { historyLog: HistorialItem[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('Todos')

  const TYPE_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    create: { bg: 'bg-blue-50', text: 'text-blue-700', icon: <Plus size={12} /> },
    assign: { bg: 'bg-purple-50', text: 'text-purple-700', icon: <Users size={12} /> },
    status: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Clock size={12} /> },
    resolve: { bg: 'bg-green-50', text: 'text-green-700', icon: <CheckCircle size={12} /> },
    close: { bg: 'bg-gray-50', text: 'text-gray-600', icon: <X size={12} /> },
    config: { bg: 'bg-red-50', text: 'text-red-700', icon: <Settings size={12} /> },
  }

  const filtered = historyLog.filter(h =>
    (typeFilter === 'Todos' || h.type === typeFilter) &&
    (!search || h.action.toLowerCase().includes(search.toLowerCase()) || h.actor.toLowerCase().includes(search.toLowerCase()) || h.target.toLowerCase().includes(search.toLowerCase()))
  )

  const [exportingHistory, setExportingHistory] = useState(false)
  const [exportHistoryError, setExportHistoryError] = useState('')

  const descargarHistorial = async () => {
    if (exportingHistory) return
    setExportingHistory(true)
    setExportHistoryError('')
    try {
      const blob = await api.historial.descargar(400)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historial-soporte-sena-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportHistoryError((err instanceof Error ? err.message : '') || 'No se pudo descargar el historial')
    } finally {
      setExportingHistory(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en historial..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-sena-green" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-sena-green">
            {['Todos', 'create', 'assign', 'status', 'resolve', 'close', 'config'].map(t => (
              <option key={t} value={t}>{t === 'Todos' ? 'Todos los tipos' : t === 'create' ? 'Creación' : t === 'assign' ? 'Asignación' : t === 'status' ? 'Estado' : t === 'resolve' ? 'Resolución' : t === 'close' ? 'Cierre' : 'Configuración'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-3">
            {exportHistoryError ? <span className="text-[11px] text-red-500">{exportHistoryError}</span> : null}
            <button onClick={descargarHistorial} disabled={exportingHistory} className="text-xs text-sena-green font-semibold hover:underline disabled:opacity-60 flex items-center gap-1">
              <Download size={11} /> {exportingHistory ? 'Generando...' : 'Exportar'}
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.map(h => {
            const tc = TYPE_COLORS[h.type]
            return (
              <div key={h.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${tc.bg} ${tc.text}`}>
                  {tc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{h.action}</p>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">{formatDate(h.time)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">por <span className="font-semibold text-gray-700">{h.actor}</span></span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{h.role}</span>
                    <span className="text-xs text-sena-green font-mono font-semibold">{h.target}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════ */
function SettingsSection() {
  const [config, setConfig] = useState({
    notificar_nuevo_caso: true,
    notificar_asignacion: true,
    notificar_resolucion: false,
    notificar_email: true,
    asignacion_automatica: false,
  })
  const [cargandoConfig, setCargandoConfig] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [configMsg, setConfigMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passMsg, setPassMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [cambiando, setCambiando] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [qr, setQr] = useState<{ dataUrl: string; url: string } | null>(null)
  const [qrError, setQrError] = useState('')
  const [descargando, setDescargando] = useState(false)

  const cargarQr = () => {
    setQrError('')
    api.qr.obtener().then(setQr).catch((err: Error) => setQrError(err.message))
  }

  useEffect(() => {
    cargarQr()
    api.configuracion.obtener()
      .then((data) => setConfig(prev => ({ ...prev, ...data })))
      .catch((err: Error) => setConfigMsg({ tipo: 'err', texto: err.message }))
      .finally(() => setCargandoConfig(false))
  }, [])

  const toggle = (key: keyof typeof config) => {
    setConfigMsg(null)
    setConfig(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const guardarAjustes = async () => {
    setGuardando(true)
    setConfigMsg(null)
    try {
      const data = await api.configuracion.actualizar(config)
      setConfig(prev => ({ ...prev, ...data }))
      setConfigMsg({ tipo: 'ok', texto: 'Ajustes guardados correctamente' })
    } catch (err) {
      setConfigMsg({ tipo: 'err', texto: err instanceof Error ? err.message : 'No se pudieron guardar los ajustes' })
    } finally {
      setGuardando(false)
    }
  }

  const descargarQr = async () => {
    setDescargando(true)
    try {
      const blob = await api.qr.descargarPng()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'qr-soporte-sena.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setQrError(err instanceof Error ? err.message : 'No se pudo descargar')
    } finally {
      setDescargando(false)
    }
  }

  const cambiarPassword = async () => {
    setPassMsg(null)
    if (!currentPass) {
      setPassMsg({ tipo: 'err', texto: 'Ingresa la contraseña actual' })
      return
    }
    if (newPass.length < 6) {
      setPassMsg({ tipo: 'err', texto: 'La nueva contraseña debe tener al menos 6 caracteres' })
      return
    }
    if (newPass !== confirmPass) {
      setPassMsg({ tipo: 'err', texto: 'Las contraseñas nuevas no coinciden' })
      return
    }
    setCambiando(true)
    try {
      await api.auth.cambiarPassword(currentPass, newPass)
      setPassMsg({ tipo: 'ok', texto: 'Contraseña actualizada correctamente' })
      setCurrentPass('')
      setNewPass('')
      setConfirmPass('')
    } catch (err) {
      setPassMsg({ tipo: 'err', texto: err instanceof Error ? err.message : 'No se pudo actualizar la contraseña' })
    } finally {
      setCambiando(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* QR */}
      <SettingCard icon={<QrCode size={18} className="text-sena-green" />} title="Código QR general" description="El QR único para reportar novedades desde cualquier espacio">
        <div className="flex items-center justify-between">
          <div className="w-28 h-28 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden">
            {qr ? <img src={qr.dataUrl} alt="Código QR" className="w-full h-full object-contain p-1" /> : <QrCode size={48} className="text-gray-300" />}
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <button onClick={descargarQr} disabled={descargando} className="px-4 py-2 rounded-xl bg-sena-green text-white text-xs font-bold hover:bg-sena-dark transition-colors flex items-center gap-1.5 shadow-md shadow-green-200 disabled:opacity-70">
              <Download size={12} /> {descargando ? 'Descargando...' : 'Descargar QR'}
            </button>
            <button onClick={cargarQr} className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Recargar
            </button>
            {qrError ? (
              <p className="text-[11px] text-red-500 mt-1">{qrError}</p>
            ) : (
              <p className="text-[11px] text-gray-400 mt-1 break-all">{qr?.url}</p>
            )}
          </div>
        </div>
      </SettingCard>

      {/* Notifications */}
      <SettingCard icon={<Bell size={18} className="text-blue-500" />} title="Notificaciones" description="Configura cuándo y cómo recibes alertas">
        <div className="space-y-3">
          {[
            { label: 'Nuevo caso reportado', sub: 'Notifica cuando llega un caso nuevo', key: 'notificar_nuevo_caso' as const },
            { label: 'Caso asignado', sub: 'Cuando un técnico toma un caso', key: 'notificar_asignacion' as const },
            { label: 'Caso resuelto', sub: 'Cuando un técnico cierra un caso', key: 'notificar_resolucion' as const },
            { label: 'Notificaciones por email', sub: 'Envía resumen diario al correo', key: 'notificar_email' as const },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
              <button onClick={() => toggle(item.key)} className={`w-11 h-6 rounded-full transition-colors relative ${config[item.key] ? 'bg-sena-green' : 'bg-gray-200'}`}>
                <div className="bg-white rounded-full shadow absolute top-0.5 transition-all"
                  style={{ left: config[item.key] ? '1.35rem' : '0.125rem', width: '1.1rem', height: '1.1rem' }} />
              </button>
            </div>
          ))}
          {cargandoConfig && <p className="text-xs text-gray-400">Cargando ajustes...</p>}
          {configMsg && (
            <p className={`text-xs font-semibold ${configMsg.tipo === 'ok' ? 'text-sena-green' : 'text-red-500'}`}>{configMsg.texto}</p>
          )}
          <button onClick={guardarAjustes} disabled={guardando || cargandoConfig} className="px-4 py-2 rounded-xl bg-sena-green text-white text-xs font-bold hover:bg-sena-dark transition-colors flex items-center gap-1.5 shadow-md shadow-green-200 disabled:opacity-70">
            <Save size={12} /> {guardando ? 'Guardando...' : 'Guardar ajustes'}
          </button>
        </div>
      </SettingCard>

      {/* Automation */}
      <SettingCard icon={<Zap size={18} className="text-amber-500" />} title="Automatización" description="Reglas automáticas del sistema">
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-semibold text-gray-800">Asignación automática</p>
            <p className="text-xs text-gray-400">Asignar casos al técnico con menor carga</p>
          </div>
          <button onClick={() => toggle('asignacion_automatica')} className={`w-11 h-6 rounded-full transition-colors relative ${config.asignacion_automatica ? 'bg-sena-green' : 'bg-gray-200'}`}>
            <div className="bg-white rounded-full shadow absolute top-0.5 transition-all" style={{ left: config.asignacion_automatica ? '1.35rem' : '0.125rem', width: '1.1rem', height: '1.1rem' }} />
          </button>
        </div>
      </SettingCard>

      {/* Security */}
      <SettingCard icon={<Shield size={18} className="text-purple-500" />} title="Seguridad" description="Contraseña y acceso del administrador">
        <div className="space-y-3">
          <FormField label="Contraseña actual">
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-sena-green" />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </FormField>
          <FormField label="Nueva contraseña">
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-sena-green" />
          </FormField>
          <FormField label="Confirmar nueva contraseña">
            <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Repite la nueva contraseña" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-sena-green" />
          </FormField>
          {passMsg && (
            <p className={`text-xs font-semibold ${passMsg.tipo === 'ok' ? 'text-sena-green' : 'text-red-500'}`}>{passMsg.texto}</p>
          )}
          <button onClick={cambiarPassword} disabled={cambiando} className="bg-sena-green text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-sena-dark transition-colors flex items-center gap-2 shadow-md shadow-green-200 mt-2 disabled:opacity-70">
            <Save size={14} /> {cambiando ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </div>
      </SettingCard>
    </div>
  )
}

/* ── Helpers ── */
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function SettingCard({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">{icon}</div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{title}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

// Needed for HistorySection
function Zap({ size, className }: { size: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
}
