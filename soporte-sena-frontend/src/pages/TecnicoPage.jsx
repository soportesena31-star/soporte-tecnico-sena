import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TechnicianDashboard from '../components/TechnicianDashboard'
import { api } from '../api/client'
import { mapCasoResumen } from '../api/mappers'
import { useAuth } from '../context/AuthContext'

export default function TecnicoPage() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const [cases, setCases] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarCasos = useCallback(async () => {
    const data = await api.casos.listar()
    setCases(data.map(mapCasoResumen))
  }, [])

  useEffect(() => {
    cargarCasos().finally(() => setCargando(false))
  }, [cargarCasos])

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-sena-green border-t-transparent rounded-full animate-spin" />
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
