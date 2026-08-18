import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import {
  ChevronLeft, ChevronRight, Clock, Plus, X, Moon, Power,
  AlertTriangle, Check, CalendarDays, Loader2, Save,
} from 'lucide-react'

/** Tipo de una fila de la grilla que devuelve el backend (una por tecnico+dia). */
interface FilaGrilla {
  tecnico_id: number
  tecnico_nombre: string | null
  dia_semana: number
  horario_id: number | null
  horario_nombre: string | null
  hora_inicio: string | null
  hora_fin: string | null
  descanso: boolean
}

interface Turno {
  id: number
  nombre: string
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

interface Props {
  technicians: { id: string; name: string; role: string; activo?: boolean }[]
}

// El sabado lo cubren 1 o 2 tecnicos con el turno 8-5 fijo (regla de negocio).
const DIA_SABADO = 6
const MAX_SABADO = 2
const NOMBRE_TURNO_SABADO = '8-5'

const DIAS = [
  { n: 1, label: 'Lun' },
  { n: 2, label: 'Mar' },
  { n: 3, label: 'Mié' },
  { n: 4, label: 'Jue' },
  { n: 5, label: 'Vie' },
  { n: 6, label: 'Sáb' },
]

const COLORES_TURNO: Record<string, string> = {
  '6-2': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  '7-4': 'bg-sky-100 text-sky-800 border-sky-200',
  '8-5': 'bg-orange-100 text-orange-800 border-orange-200',
}

const colorTurno = (nombre: string | null) =>
  (nombre && COLORES_TURNO[nombre]) || 'bg-indigo-100 text-indigo-800 border-indigo-200'

const fmtFecha = (d: Date) => {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const lunesDe = (fecha: Date) => {
  const d = new Date(fecha)
  const diasDesdeLunes = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diasDesdeLunes)
  return d
}

const formatearSemana = (semana: string) => {
  const d = new Date(`${semana}T00:00:00`)
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
}

const horaCorta = (h: string | null) => (h ? h.slice(0, 5) : '')

export default function HorariosSection({ technicians }: Props) {
  const [semana, setSemana] = useState(() => fmtFecha(lunesDe(new Date())))
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [grilla, setGrilla] = useState<Record<number, Record<number, FilaGrilla>>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [celdaAbierta, setCeldaAbierta] = useState<{ t: string; dia: number } | null>(null)
  const [showTurnos, setShowTurnos] = useState(false)

  const tecnicos = useMemo(
    () => technicians.filter((t) => t.role === 'Técnico' && t.activo !== false),
    [technicians],
  )

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const [turnosRes, grillaRes] = await Promise.all([
        api.horarios.listar(),
        api.horariosTecnicos.grilla(semana),
      ])
      setTurnos(turnosRes)
      const mapa: Record<number, Record<number, FilaGrilla>> = {}
      for (const fila of grillaRes.grilla as FilaGrilla[]) {
        if (!mapa[fila.tecnico_id]) mapa[fila.tecnico_id] = {}
        mapa[fila.tecnico_id][fila.dia_semana] = fila
      }
      setGrilla(mapa)
    } catch (e) {
      setError((e as Error).message || 'No se pudo cargar la semana')
    } finally {
      setCargando(false)
    }
  }, [semana])

  useEffect(() => { cargar() }, [cargar])

  const turnoSabado = useMemo(
    () => turnos.find((t) => t.nombre === NOMBRE_TURNO_SABADO && t.activo) || null,
    [turnos],
  )

  // Estado de un dia (L-V) del tecnico: fila guardada o "sin definir".
  const diaDe = (t: string, dia: number): FilaGrilla =>
    grilla[Number(t)]?.[dia] || {
      tecnico_id: Number(t), tecnico_nombre: null, dia_semana: dia,
      horario_id: null, horario_nombre: null, hora_inicio: null, hora_fin: null,
      descanso: false,
    }

  // Cuantos tecnicos tienen sabado asignado (regla 1-2).
  const sabadosAsignados = useMemo(
    () => tecnicos.filter((t) => diaDe(t.id, DIA_SABADO).horario_id).length,
    [tecnicos, grilla], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const diasActualesDe = (t: string) => {
    const actuales = DIAS.map((d) => ({ ...diaDe(t, d.n), dia_semana: d.n }))
    // Normaliza para que el payload siempre traiga los 6 dias completos.
    return actuales.map((f) => ({
      dia_semana: f.dia_semana,
      horario_id: f.horario_id,
      descanso: f.descanso,
    }))
  }

  const aplicarDia = async (t: string, dia: number, horario_id: number | null, descanso: boolean) => {
    setError('')
    setAviso('')
    setGuardandoId(t)
    try {
      const dias = diasActualesDe(t).map((d) =>
        d.dia_semana === dia ? { dia_semana: dia, horario_id, descanso } : d)
      const res = await api.horariosTecnicos.guardarTecnico(t, { semana, dias })
      const mapa = { ...grilla }
      const porDia: Record<number, FilaGrilla> = {}
      for (const d of (res.dias as { dia_semana: number; horario_id: number | null; horario_nombre: string | null; descanso: boolean }[])) {
        porDia[d.dia_semana] = {
          tecnico_id: Number(t), tecnico_nombre: null, dia_semana: d.dia_semana,
          horario_id: d.horario_id, horario_nombre: d.horario_nombre,
          hora_inicio: null, hora_fin: null, descanso: d.descanso,
        }
      }
      mapa[Number(t)] = porDia
      setGrilla(mapa)
    } catch (e) {
      setError((e as Error).message || 'No se pudo guardar')
    } finally {
      setGuardandoId(null)
    }
  }

  // Sabado: alterna entre trabajar (turno 8-5 fijo) y descanso.
  const toggleSabado = async (t: string) => {
    setError('')
    const actual = diaDe(t, DIA_SABADO)
    if (actual.horario_id) {
      await aplicarDia(t, DIA_SABADO, null, true)
      return
    }
    if (!turnoSabado) {
      setError(`No existe el turno ${NOMBRE_TURNO_SABADO} en el catalogo de turnos`)
      return
    }
    if (sabadosAsignados >= MAX_SABADO) {
      setError(`El sabado ya tiene ${MAX_SABADO} tecnicos asignados (maximo permitido)`)
      return
    }
    await aplicarDia(t, DIA_SABADO, turnoSabado.id, false)
  }

  // Compensacion suave: quien trabaja sabado sin ningun descanso L-V se avisa.
  const sinCompensacion = (t: string) => {
    const sab = diaDe(t, DIA_SABADO)
    if (!sab.horario_id) return false
    return !DIAS.filter((d) => d.n !== DIA_SABADO).some((d) => diaDe(t, d.n).descanso)
  }

  const navegarSemana = (delta: number) => {
    const d = new Date(`${semana}T00:00:00`)
    d.setDate(d.getDate() + delta * 7)
    setSemana(fmtFecha(d))
    setCeldaAbierta(null)
  }

  return (
    <div className="space-y-4">
      {/* Header: titulo + navegacion de semanas + catalogo */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1">
            <button onClick={() => navegarSemana(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Semana anterior">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setSemana(fmtFecha(lunesDe(new Date())))} className="px-2 py-1 rounded-lg hover:bg-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1">
              <CalendarDays size={14} /> {formatearSemana(semana)}
            </button>
            <button onClick={() => navegarSemana(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Semana siguiente">
              <ChevronRight size={16} />
            </button>
          </div>
          <span className="text-xs text-gray-400 font-medium hidden sm:block">Semana del {formatearSemana(semana)}</span>
        </div>
        <button onClick={() => setShowTurnos(true)} className="bg-sena-green text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-sena-dark transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-md shadow-green-200">
          <Clock size={15} /> Editar turnos
        </button>
      </div>

      {cargando && (
        <div className="bg-white rounded-2xl p-10 flex items-center justify-center text-sm text-gray-400">
          <Loader2 size={18} className="animate-spin mr-2" /> Cargando horarios...
        </div>
      )}

      {!cargando && (
        <>
          {sabadosAsignados === 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl px-4 py-3">
              <AlertTriangle size={15} /> Esta semana no hay técnicos asignados al sábado (mínimo 1 requerido)
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl px-4 py-3">
              <AlertTriangle size={15} /> {error}
            </div>
          )}
          {aviso && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl px-4 py-3">
              <Check size={15} /> {aviso}
            </div>
          )}

          {/* Tabla semanal */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 sticky left-0 bg-gray-50 z-10 min-w-[160px]">
                      Técnico
                    </th>
                    {DIAS.map((d) => (
                      <th key={d.n} className={`text-center px-3 py-3 text-xs font-bold text-gray-500 min-w-[96px] ${d.n === DIA_SABADO ? 'bg-orange-50' : ''}`}>
                        {d.label}
                        {d.n === DIA_SABADO && (
                          <span className="block text-[10px] font-semibold text-orange-600 mt-0.5">
                            {sabadosAsignados}/{MAX_SABADO} · 8-5 fijo
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tecnicos.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-xs text-gray-400">No hay técnicos activos para asignar horarios</td></tr>
                  )}
                  {tecnicos.map((t, idx) => {
                    const sab = diaDe(t.id, DIA_SABADO)
                    const trabajando = !!sab.horario_id
                    const comp = sinCompensacion(t.id)
                    return (
                      <tr key={t.id} className={`border-b border-gray-50 ${idx % 2 ? 'bg-white' : 'bg-gray-50/40'}`}>
                        <td className="px-4 py-2.5 sticky left-0 bg-inherit z-10">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-sena-navy/10 flex items-center justify-center font-black text-xs text-sena-green flex-shrink-0">
                              {t.name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '??'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{t.name}</p>
                              {guardandoId === t.id && <p className="text-[10px] text-sena-green font-medium flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> guardando...</p>}
                            </div>
                          </div>
                        </td>
                        {DIAS.map((d) => {
                          const fila = diaDe(t.id, d.n)
                          const esSabado = d.n === DIA_SABADO
                          const esDescanso = fila.descanso
                          const definido = esSabado ? trabajando || esDescanso : fila.horario_id !== null || esDescanso
                          return (
                            <td key={d.n} className={`px-2 py-2 text-center ${esSabado ? 'bg-orange-50/40' : ''}`}>
                              <div className="relative flex justify-center">
                                <button
                                  onClick={() => esSabado ? toggleSabado(t.id) : setCeldaAbierta({ t: t.id, dia: d.n })}
                                  disabled={guardandoId === t.id}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all hover:shadow-sm disabled:opacity-60 ${
                                    !definido
                                      ? 'border-dashed border-gray-300 text-gray-400 hover:border-sena-green hover:text-sena-green'
                                      : esDescanso
                                        ? 'bg-gray-100 text-gray-500 border-gray-200'
                                        : `${colorTurno(fila.horario_nombre)} ${esSabado && comp ? 'ring-2 ring-amber-400' : ''}`
                                  }`}
                                  title={esSabado && comp ? 'Trabaja sabado sin descanso compensatorio entre semana' : undefined}
                                >
                                  {esSabado ? (
                                    trabajando ? (
                                      <>
                                        <Power size={11} /> {fila.horario_nombre || NOMBRE_TURNO_SABADO}
                                      </>
                                    ) : esDescanso ? (
                                      <><Moon size={11} /> Descanso</>
                                    ) : (
                                      '—'
                                    )
                                  ) : esDescanso ? (
                                    <><Moon size={11} /> Descanso</>
                                  ) : fila.horario_nombre ? (
                                    <>
                                      {fila.horario_nombre}
                                      {(fila.hora_inicio || fila.hora_fin) && (
                                        <span className="text-[9px] font-medium opacity-70">
                                          {horaCorta(fila.hora_inicio)}-{horaCorta(fila.hora_fin)}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    '—'
                                  )}
                                </button>

                                {/* Popover de turnos para dias L-V */}
                                {celdaAbierta && celdaAbierta.t === t.id && celdaAbierta.dia === d.n && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setCeldaAbierta(null)} />
                                    <div className="absolute z-50 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5">
                                      {turnos.filter((tu) => tu.activo).map((tu) => (
                                        <button
                                          key={tu.id}
                                          onClick={() => { setCeldaAbierta(null); aplicarDia(t.id, d.n, tu.id, false) }}
                                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold flex items-center justify-between hover:bg-gray-50 ${fila.horario_id === tu.id ? 'bg-gray-50' : ''}`}
                                        >
                                          <span>{tu.nombre}</span>
                                          <span className="text-[9px] font-medium text-gray-400">{horaCorta(tu.hora_inicio)}-{horaCorta(tu.hora_fin)}</span>
                                        </button>
                                      ))}
                                      <div className="border-t border-gray-100 my-1" />
                                      <button
                                        onClick={() => { setCeldaAbierta(null); aplicarDia(t.id, d.n, null, true) }}
                                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 ${fila.descanso ? 'bg-gray-50 text-gray-500' : 'text-gray-500'}`}
                                      >
                                        <Moon size={11} /> Descanso
                                      </button>
                                      {turnos.filter((tu) => tu.activo).length === 0 && (
                                        <p className="px-2.5 py-2 text-[10px] text-gray-400">No hay turnos activos</p>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <Power size={11} className="text-orange-500" /> Sábado: 1 o 2 técnicos con turno 8-5 fijo · quien trabaja sábado puede descansar un día entre semana (aviso ámbar, no bloquea)
          </p>
        </>
      )}

      {/* Catalogo de turnos */}
      {showTurnos && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowTurnos(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock size={17} className="text-sena-green" />
                <h3 className="font-black text-gray-900">Catálogo de turnos</h3>
              </div>
              <button onClick={() => setShowTurnos(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto p-5 space-y-3">
              {turnos.map((tu) => (
                <FilaTurnoCatalogo
                  key={tu.id}
                  turno={tu}
                  onGuardado={(actualizado) => {
                    setTurnos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
                    setAviso('Turno actualizado')
                  }}
                  onError={(msg) => setError(msg)}
                />
              ))}
              <FilaTurnoCatalogo
                turno={null}
                onGuardado={(creado) => {
                  setTurnos((prev) => [...prev, creado])
                  setAviso('Turno creado')
                }}
                onError={(msg) => setError(msg)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Fila editable del catalogo: edita un turno existente o crea uno nuevo. */
function FilaTurnoCatalogo({ turno, onGuardado, onError }: {
  turno: Turno | null
  onGuardado: (t: Turno) => void
  onError: (msg: string) => void
}) {
  const [nombre, setNombre] = useState(turno?.nombre || '')
  const [inicio, setInicio] = useState(turno?.hora_inicio?.slice(0, 5) || '')
  const [fin, setFin] = useState(turno?.hora_fin?.slice(0, 5) || '')
  const [activo, setActivo] = useState(turno?.activo !== false)
  const [guardando, setGuardando] = useState(false)
  const [nuevo, setNuevo] = useState(false)

  const guardar = async () => {
    if (!nombre.trim() || !inicio || !fin) return
    setGuardando(true)
    try {
      const payload = { nombre: nombre.trim(), hora_inicio: inicio, hora_fin: fin, activo }
      const res = turno
        ? await api.horarios.actualizar(turno.id, payload)
        : await api.horarios.crear(payload)
      onGuardado(res)
      if (!turno) {
        setNombre(''); setInicio(''); setFin(''); setActivo(true)
      }
    } catch (e) {
      onError((e as Error).message || 'No se pudo guardar el turno')
    } finally {
      setGuardando(false)
    }
  }

  if (nuevo && !turno) {
    return (
      <div className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2">
        <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><Plus size={12} /> Nuevo turno</p>
        <div className="grid grid-cols-3 gap-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: 1-8" className="px-2.5 py-1.5 rounded-lg border-2 border-gray-100 text-xs focus:outline-none focus:border-sena-green" />
          <input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} className="px-2.5 py-1.5 rounded-lg border-2 border-gray-100 text-xs focus:outline-none focus:border-sena-green" />
          <input type="time" value={fin} onChange={(e) => setFin(e.target.value)} className="px-2.5 py-1.5 rounded-lg border-2 border-gray-100 text-xs focus:outline-none focus:border-sena-green" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setNuevo(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50">Cancelar</button>
          <button onClick={guardar} disabled={guardando || !nombre.trim() || !inicio || !fin} className="px-3 py-1.5 rounded-lg bg-sena-green text-white text-xs font-bold hover:bg-sena-dark disabled:opacity-50 flex items-center gap-1">
            <Save size={11} /> {guardando ? 'Guardando...' : 'Crear turno'}
          </button>
        </div>
      </div>
    )
  }

  if (!turno && !nuevo) {
    return (
      <button onClick={() => setNuevo(true)} className="w-full border border-dashed border-gray-300 rounded-xl py-3 text-xs font-bold text-gray-500 hover:border-sena-green hover:text-sena-green transition-colors flex items-center justify-center gap-1.5">
        <Plus size={13} /> Agregar turno
      </button>
    )
  }

  return (
    <div className={`border rounded-xl p-3 space-y-2 ${turno && !turno.activo ? 'bg-gray-50 border-gray-200' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-800">{turno?.nombre}</p>
          {turno && !turno.activo && <span className="text-[10px] font-bold text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">Desactivado</span>}
          {turno?.nombre === NOMBRE_TURNO_SABADO && (
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">Turno del sábado</span>
          )}
        </div>
        {turno && (
          <button
            type="button"
            onClick={() => setActivo((v) => !v)}
            className={`w-10 h-5 rounded-full transition-colors relative ${activo ? 'bg-sena-green' : 'bg-gray-300'}`}
            title={activo ? 'Desactivar turno' : 'Activar turno'}
          >
            <div className="bg-white rounded-full shadow absolute top-0.5 transition-all" style={{ left: activo ? '1.2rem' : '0.125rem', width: '0.9rem', height: '0.9rem' }} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre (ej. 6-2)" className="px-2.5 py-1.5 rounded-lg border-2 border-gray-100 text-xs focus:outline-none focus:border-sena-green" />
        <input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} className="px-2.5 py-1.5 rounded-lg border-2 border-gray-100 text-xs focus:outline-none focus:border-sena-green" />
        <input type="time" value={fin} onChange={(e) => setFin(e.target.value)} className="px-2.5 py-1.5 rounded-lg border-2 border-gray-100 text-xs focus:outline-none focus:border-sena-green" />
      </div>
      <div className="flex justify-end">
        <button onClick={guardar} disabled={guardando || !nombre.trim() || !inicio || !fin} className="px-3 py-1.5 rounded-lg bg-sena-green text-white text-xs font-bold hover:bg-sena-dark disabled:opacity-50 flex items-center gap-1">
          <Save size={11} /> {guardando ? 'Guardando...' : turno ? 'Guardar cambios' : 'Crear turno'}
        </button>
      </div>
    </div>
  )
}