import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../api/client'

export default function RestablecerPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return }

    setEnviando(true)
    try {
      await api.auth.restablecerPassword(token, password)
      setListo(true)
    } catch (err) {
      setError(err.message || 'Este enlace no es válido o ya venció')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          {listo ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="text-sena-green mx-auto mb-3" />
              <p className="font-bold text-gray-900 mb-4">Contraseña actualizada</p>
              <button onClick={() => navigate('/login')} className="w-full bg-sena-green text-white py-3 rounded-2xl font-bold text-sm hover:bg-sena-dark transition-all">
                Iniciar sesión
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-black text-gray-900 mb-1">Nueva contraseña</h1>
              <p className="text-sm text-gray-500 mb-5">Elige una contraseña nueva para tu cuenta.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full px-3 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green transition-colors"
                />
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
                  {enviando ? 'Guardando...' : 'Guardar nueva contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
