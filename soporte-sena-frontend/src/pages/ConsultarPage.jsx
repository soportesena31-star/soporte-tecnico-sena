import { useNavigate, useParams } from 'react-router-dom'
import TrackCase from '../components/TrackCase'
import { api } from '../api/client'
import { mapCaso } from '../api/mappers'

export default function ConsultarPage() {
  const navigate = useNavigate()
  const { numeroCaso } = useParams()

  const handleSearch = async (numero) => {
    try {
      const caso = await api.casos.consultar(numero)
      return mapCaso(caso)
    } catch (err) {
      if (err.status === 404) return null
      throw err
    }
  }

  return (
    <TrackCase
      initialCase={numeroCaso}
      onSearch={handleSearch}
      onBack={() => navigate('/')}
    />
  )
}
