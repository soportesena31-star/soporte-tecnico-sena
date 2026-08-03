import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import Confirmation from '../components/Confirmation'

export default function ConfirmacionPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const caso = state?.caso

  if (!caso) return <Navigate to="/reportar" replace />

  return (
    <Confirmation
      caseNumber={caso.number}
      space={caso.space}
      category={caso.category}
      createdAt={caso.createdAt}
      onTrack={() => navigate(`/consultar/${caso.number}`)}
      onNewReport={() => navigate('/reportar')}
    />
  )
}
