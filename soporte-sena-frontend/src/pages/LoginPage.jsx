import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Login from '../components/Login'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { usuario, cargando, login } = useAuth()

  // Si ya hay sesion valida (p. ej. llego aqui con el boton atras), no se
  // muestra el formulario: se devuelve al area de trabajo.
  useEffect(() => {
    if (!cargando && usuario) {
      navigate(usuario.rol === 'administrador' ? '/admin' : '/casos', { replace: true })
    }
  }, [usuario, cargando, navigate])

  const handleSubmit = async (email, password) => {
    const usuario = await login(email, password)
    navigate(usuario.rol === 'administrador' ? '/admin' : '/casos', { replace: true })
  }

  return <Login onSubmit={handleSubmit} onBack={() => navigate('/')} onForgotPassword={() => navigate('/olvide-password')} />
}
