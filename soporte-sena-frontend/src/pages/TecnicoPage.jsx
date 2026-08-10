import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TechnicianDashboard from '../components/TechnicianDashboard'
import { api } from '../api/client'
import { mapCasoResumen } from '../api/mappers'
import { useAuth } from '../context/AuthContext'
import { usarBadgePendientes } from '../hooks/useAppBadge'
import { useCasoActualizado } from '../hooks/useCasoActualizado'

export default function TecnicoPage() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const [cases, setCases] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  const cargarCasos = useCallback(async () => {
    const data = await api.casos.listar()
    setCases(data.map(mapCasoResumen))
  }, [])

  useEffect(() => {
    cargarCasos()
      .catch((err) => setErrorCarga(err.message || 'No se pudieron cargar los casos'))
      .finally(() => setCargando(false))
  }, [cargarCasos])

  // Recarga en vivo cuando el backend publica un cambio (nuevo caso, tomar,
  // asignar, iniciar, resolver, reabrir, nota). Con esto el badge se
  // recalcula en el mismo ciclo, sin esperar una recarga manual.
  const refrescarEnVivo = useCallback(() => {
    cargarCasos().catch(() => {})
  }, [cargarCasos])
  useCasoActualizado(refrescarEnVivo)

  // Badge del icono: casos abiertos sin atender (mismo conteo que el admin).
  const pendientes = cargando
    ? null
    : cases.filter((c) => c.status === 'Abierto').length
  usarBadgePendientes(pendientes)

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-sena-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="min-h-screen bg-[#F0F2F7] flex flex-col items-center justify-center px-6 text-center">
        <p className="font-semibold text-gray-900 mb-1">No pudimos cargar los casos</p>
        <p className="text-sm text-gray-500 mb-4">{errorCarga}</p>
        <button onClick={() => window.location.reload()} className="text-sm font-semibold text-sena-green underline">Reintentar</button>
      </div>
    )
  }

  return (
    <TechnicianDashboard
      techName={usuario.nombre}
      techEmail={usuario.email}
      cases={cases}
      currentTechId={String(usuario.id)}
      onCaseSelect={(c) => navigate(`/casos/${c.number}`)}
      onLogout={() => { logout(); navigate('/') }}
    />
  )
}
