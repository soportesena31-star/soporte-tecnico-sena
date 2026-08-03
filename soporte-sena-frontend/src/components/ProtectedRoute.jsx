import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, rolRequerido }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-sena-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" replace />

  // Normalización del rol del usuario (soporta string 'administrador'/'tecnico' o objeto rol { nombre })
  const nombreRolRaw = typeof usuario.rol === 'object' ? usuario.rol?.nombre : usuario.rol
  const esAdmin = nombreRolRaw?.toLowerCase() === 'administrador'
  const rolActual = esAdmin ? 'Administrador' : 'Técnico'

  if (rolRequerido && rolActual !== rolRequerido) {
    return <Navigate to={esAdmin ? '/admin' : '/casos'} replace />
  }

  return children
}
