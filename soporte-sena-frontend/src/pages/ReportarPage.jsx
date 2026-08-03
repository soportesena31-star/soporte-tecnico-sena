import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReportForm from '../components/ReportForm'
import { api } from '../api/client'
import { mapEspacio, mapCaso, PRIORIDAD_DISPLAY } from '../api/mappers'

export default function ReportarPage() {
  const navigate = useNavigate()
  const [spaces, setSpaces] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const [espaciosRes, categoriasRes] = await Promise.all([
          api.espacios.listar(),
          api.categorias.listar(),
        ])
        setSpaces(espaciosRes.map(mapEspacio))
        setCategorias(categoriasRes)
      } catch (err) {
        setErrorCarga(err.message || 'No se pudo conectar con el servidor')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const noveltyTypes = categorias.map((c) => c.nombre)
  const priorityDefaults = Object.fromEntries(
    categorias.map((c) => [c.nombre, PRIORIDAD_DISPLAY[c.prioridad_sugerida]]),
  )

  const handleSubmit = async ({ space, customLocation, reportedBy, category, description, photoFiles }) => {
    const categoria = categorias.find((c) => c.nombre === category)

    const formData = new FormData()
    if (space?.id) {
      formData.append('espacio_id', space.id)
    }
    if (customLocation) {
      formData.append('ubicacion_personalizada', customLocation)
    }
    formData.append('categoria_id', String(categoria.id))
    formData.append('reportado_por', reportedBy)
    formData.append('descripcion', description)

    if (Array.isArray(photoFiles)) {
      photoFiles.forEach((file) => {
        formData.append('fotos_novedad', file)
      })
    }

    const casoCreado = await api.casos.crear(formData)
    navigate('/confirmacion', { state: { caso: mapCaso(casoCreado) }, replace: true })
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-sena-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center px-6 text-center">
        <p className="font-semibold text-gray-900 mb-1">No pudimos cargar el formulario</p>
        <p className="text-sm text-gray-500 mb-4">{errorCarga}</p>
        <button onClick={() => window.location.reload()} className="text-sm font-semibold text-sena-green underline">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <ReportForm
      spaces={spaces}
      noveltyTypes={noveltyTypes}
      priorityDefaults={priorityDefaults}
      onSubmit={handleSubmit}
    />
  )
}
