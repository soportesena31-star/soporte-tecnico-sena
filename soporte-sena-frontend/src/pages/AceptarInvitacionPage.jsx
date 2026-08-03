import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { api, setToken } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function AceptarInvitacionPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { setUsuarioDirecto } = useAuth()

  const [cargando, setCargando] = useState(true)
  const [invitacion, setInvitacion] = useState(null)
  const [errorCarga, setErrorCarga] = useState('')

  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.invitaciones.ver(token)
      .then(setInvitacion)
      .catch((err) => setErrorCarga(err.message || 'Esta invitación no es válida'))
      .finally(() => setCargando(false))
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return }

    setEnviando(true)
    try {
      const { token: jwt, usuario } = await api.invitaciones.aceptar(token, password)
      setToken(jwt)
      setUsuarioDirecto(usuario)
      navigate(usuario.rol === 'administrador' ? '/admin' : '/casos', { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo activar la cuenta')
      setEnviando(false)
    }
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
        <AlertCircle size={40} className="text-gray-300 mb-3" />
        <p className="font-semibold text-gray-900 mb-1">Invitación no válida</p>
        <p className="text-sm text-gray-500 mb-4">{errorCarga}</p>
        <button onClick={() => navigate('/login')} className="text-sm font-semibold text-sena-green underline">Ir a iniciar sesión</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-sena-green rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-200">
            <CheckCircle size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Activa tu cuenta</h1>
          <p className="text-sm text-gray-500 mt-1">
            {invitacion.email} · <span className="font-semibold text-sena-green">{invitacion.rol}</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Crea tu contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-9 pr-10 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green transition-colors"
                />
                <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Confirma tu contraseña</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full px-3 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-medium rounded-xl px-3 py-2.5 flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-sena-green text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-green-200 hover:bg-sena-dark active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {enviando ? 'Activando...' : 'Activar cuenta e iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
