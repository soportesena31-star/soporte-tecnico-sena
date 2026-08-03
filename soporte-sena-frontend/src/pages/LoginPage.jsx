import { useNavigate } from 'react-router-dom'
import Login from '../components/Login'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (email, password) => {
    const usuario = await login(email, password)
    navigate(usuario.rol === 'administrador' ? '/admin' : '/casos', { replace: true })
  }

  return <Login onSubmit={handleSubmit} onBack={() => navigate('/')} onForgotPassword={() => navigate('/olvide-password')} />
}
