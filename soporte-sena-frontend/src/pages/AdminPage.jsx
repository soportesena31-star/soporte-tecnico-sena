import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AdminDashboard from '../components/AdminDashboard'
import { api } from '../api/client'
import {
  mapCasoResumen, mapEspacio, mapTecnico, mapHistorialGlobal, tipoEspacioAApi, PRIORIDAD_DISPLAY,
} from '../api/mappers'
import { useAuth } from '../context/AuthContext'
import { usarBadgePendientes } from '../hooks/useAppBadge'
import { useCasoActualizado } from '../hooks/useCasoActualizado'

export default function AdminPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { usuario, logout } = useAuth()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  // Deep link desde notificacion: ?caso=NUMERO abre ese caso en el panel.
  // El parametro se consume una vez (por valor) y se limpia para no reabrir
  // el modal al recargar; asi la campana puede reabrir casos en cualquier
  // momento con un ?caso= nuevo o repetido.
  const casoInicial = searchParams.get('caso')
  const casoConsumido = useRef(null)
  useEffect(() => {
    if (casoInicial && casoConsumido.current !== casoInicial) {
      casoConsumido.current = casoInicial
      setSearchParams({}, { replace: true })
    }
  }, [casoInicial, setSearchParams])

  // Evita que una carga vieja pise a una mas reciente cuando varias se
  // superponen (evento SSE + accion propia + badge): solo aplica el estado la
  // invocacion que fue la ultima en iniciarse; el resto se descarta.
  const cargaSeq = useRef(0)
  const cargarTodo = useCallback(async () => {
    const seq = ++cargaSeq.current
    const [casosRes, espaciosRes, usuariosRes, categoriasRes, historialRes, rolesRes] = await Promise.all([
      api.casos.listar(),
      api.espacios.listar(),
      api.usuarios.listar(),
      api.categorias.listar(),
      api.historial.listar({ limite: 100 }),
      api.roles.listar(),
    ])
    if (seq !== cargaSeq.current) return

    const cases = casosRes.map(mapCasoResumen)
    const conteoPorCategoria = cases.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1
      return acc
    }, {})

    setDatos({
      cases,
      spaces: espaciosRes.map(mapEspacio),
      technicians: usuariosRes.map(mapTecnico),
      categories: categoriasRes.map((c) => ({
        id: String(c.id),
        name: c.nombre,
        priority: PRIORIDAD_DISPLAY[c.prioridad_sugerida],
        count: conteoPorCategoria[c.nombre] || 0,
      })),
      historyLog: historialRes.map(mapHistorialGlobal),
      roles: rolesRes.map((r) => ({ id: String(r.id), nombre: r.nombre })),
    })
  }, [])

  useEffect(() => {
    cargarTodo().catch((err) => setErrorCarga(err.message || 'No se pudo cargar el panel')).finally(() => setCargando(false))
  }, [cargarTodo])

  // Recarga en vivo cuando el backend publica un cambio de casos: el panel,
  // la campana y el badge se actualizan solos, sin recargar la pagina.
  const refrescarEnVivo = useCallback(() => {
    cargarTodo().catch(() => {})
  }, [cargarTodo])
  useCasoActualizado(refrescarEnVivo)

  // Badge del icono: casos abiertos (sin atender) para el administrador.
  const pendientes = cargando || !datos ? null : datos.cases.filter((c) => c.status === 'Abierto').length
  usarBadgePendientes(pendientes)

  const handleCreateSpace = async ({ name, type, sede }) => {
    await api.espacios.crear({ nombre: name, tipo: tipoEspacioAApi(type), sede })
    await cargarTodo()
  }

  const handleToggleSpace = async (id, active) => {
    await api.espacios.actualizar(id, { estado: active ? 'activo' : 'inactivo' })
    await cargarTodo()
  }

  const handleUpdateSpace = async (id, { name, type, sede }) => {
    await api.espacios.actualizar(id, { nombre: name, tipo: tipoEspacioAApi(type), sede })
    await cargarTodo()
  }

  const handleInvitar = async ({ email, nombre, rol_id }) => {
    const resultado = await api.invitaciones.crear(email, nombre, rol_id)
    return resultado
  }

  const handleAssignCase = async (caseId, tecnicoId) => {
    await api.casos.asignar(caseId, tecnicoId)
    await cargarTodo()
  }

  const handleReassignCase = async (caseId, tecnicoId, motivo) => {
    await api.casos.reasignar(caseId, tecnicoId, motivo)
    await cargarTodo()
  }

  const handleEditarTecnico = async (id, datos) => {
    await api.usuarios.actualizar(id, datos)
    await cargarTodo()
  }

  const prioridadAApi = (display) => {
    const mapa = { 'Baja': 'baja', 'Media': 'media', 'Alta': 'alta' }
    return mapa[display] || 'media'
  }

  const handleCrearCategoria = async ({ nombre, prioridad }) => {
    await api.categorias.crear({ nombre, prioridad_sugerida: prioridadAApi(prioridad) })
    await cargarTodo()
  }

  const handleEditarCategoria = async (id, { nombre, prioridad }) => {
    await api.categorias.actualizar(id, { nombre, prioridad_sugerida: prioridadAApi(prioridad) })
    await cargarTodo()
  }

  const handleEliminarCategoria = async (id) => {
    await api.categorias.eliminar(id)
    await cargarTodo()
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-sena-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (errorCarga || !datos) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center px-6 text-center">
        <p className="font-semibold text-gray-900 mb-1">No pudimos cargar el panel</p>
        <p className="text-sm text-gray-500 mb-4">{errorCarga}</p>
        <button onClick={() => window.location.reload()} className="text-sm font-semibold text-sena-green underline">Reintentar</button>
      </div>
    )
  }

  return (
    <AdminDashboard
      adminName={usuario.nombre}
      cases={datos.cases}
      spaces={datos.spaces}
      technicians={datos.technicians}
      categories={datos.categories}
      historyLog={datos.historyLog}
      roles={datos.roles}
      onCreateSpace={handleCreateSpace}
      onUpdateSpace={handleUpdateSpace}
      onToggleSpace={handleToggleSpace}
      onInvitar={handleInvitar}
      onAssignCase={handleAssignCase}
      onReassignCase={handleReassignCase}
      onEditarTecnico={handleEditarTecnico}
      onCrearCategoria={handleCrearCategoria}
      onEditarCategoria={handleEditarCategoria}
      onEliminarCategoria={handleEliminarCategoria}
      casoInicial={casoInicial}
      onLogout={() => { logout(); navigate('/') }}
    />
  )
}
