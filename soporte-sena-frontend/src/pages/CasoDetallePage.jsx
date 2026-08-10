import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CaseDetail from '../components/CaseDetail'
import { api } from '../api/client'
import { mapCaso } from '../api/mappers'
import { useAuth } from '../context/AuthContext'
import { useCasoActualizado } from '../hooks/useCasoActualizado'

export default function CasoDetallePage() {
  const navigate = useNavigate()
  const { numeroCaso } = useParams()
  const { usuario } = useAuth()
  const [caso, setCaso] = useState(null)
  const [tecnicos, setTecnicos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  const recargar = useCallback(async () => {
    const data = await api.casos.consultar(numeroCaso)
    const mapeado = mapCaso(data)
    setCaso(mapeado)
    return mapeado
  }, [numeroCaso])

  useEffect(() => {
    // Tecnicos activos para la reasignacion (solo si el caso lo permite).
    api.usuarios.tecnicos().then((lista) => {
      setTecnicos(lista.map((t) => ({ id: String(t.id), nombre: t.nombre })))
    }).catch(() => { /* la reasignacion simplemente no ofrecera tecnicos */ })
  }, [])

  useEffect(() => {
    recargar().catch((err) => setErrorCarga(err.message || 'No se pudo cargar el caso')).finally(() => setCargando(false))
  }, [recargar])

  // Si otro usuario cambia este caso mientras la vista esta abierta (tomar,
  // iniciar, resolver, nota, reasignar), el detalle se refresca solo.
  const refrescarEnVivo = useCallback(() => {
    recargar().catch(() => {})
  }, [recargar])
  useCasoActualizado(refrescarEnVivo)

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-sena-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (errorCarga || !caso) {
    return (
      <div className="min-h-screen bg-[#F0F2F7] flex flex-col items-center justify-center px-6 text-center">
        <p className="font-semibold text-gray-900 mb-1">No pudimos cargar este caso</p>
        <p className="text-sm text-gray-500 mb-4">{errorCarga || 'Caso no encontrado'}</p>
        <button onClick={() => navigate('/casos')} className="text-sm font-semibold text-sena-green underline">Volver a la cola</button>
      </div>
    )
  }

  const rolUsuario = (() => {
    const r = usuario?.rol
    return typeof r === 'object' && r !== null && typeof r.nombre === 'string' ? r.nombre : typeof r === 'string' ? r : ''
  })()
  const esAdmin = rolUsuario === 'administrador'
  const esTecnicoAsignado = caso.assignedTo?.id === String(usuario?.id)
  const puedeReasignar = (esAdmin || esTecnicoAsignado) && !['Resuelto', 'Cerrado'].includes(caso.status)

  return (
    <CaseDetail
      caseData={caso}
      techName={usuario.nombre}
      onBack={() => navigate('/casos')}
      onTakeCase={async () => { await api.casos.tomar(caso.id); return recargar() }}
      onStartWork={async () => { await api.casos.iniciar(caso.id); return recargar() }}
      onResolve={async (fotoFiles, notasResolucion) => {
        const formData = new FormData()
        if (Array.isArray(fotoFiles)) {
          fotoFiles.forEach((file) => formData.append('fotos_evidencia', file))
        }
        if (notasResolucion) formData.append('notas_resolucion', notasResolucion)
        await api.casos.resolver(caso.id, formData)
        return recargar()
      }}
      puedeReasignar={puedeReasignar}
      tecnicos={tecnicos}
      onReassign={async (tecnicoId, motivo) => {
        await api.casos.reasignar(caso.id, tecnicoId, motivo)
        return recargar()
      }}
    />
  )
}
