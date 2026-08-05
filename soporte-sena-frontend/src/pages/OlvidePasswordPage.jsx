import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../api/client'

export default function OlvidePasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await api.auth.olvidePassword(email)
      setEnviado(true)
    } catch (err) {
      setError(err.message || 'No se pudo procesar la solicitud')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/login')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft size={16} /> Volver a iniciar sesión
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          {enviado ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="text-sena-green mx-auto mb-3" />
              <p className="font-bold text-gray-900">Revisa tu correo</p>
              <p className="text-sm text-gray-500 mt-1">Te enviamos un enlace a {email}. Vence en 1 hora.</p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-black text-gray-900 mb-1">¿Olvidaste tu contraseña?</h1>
              <p className="text-sm text-gray-500 mb-5">Ingresa tu correo y te mandamos un enlace para restablecerla.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.correo@sena.edu.co"
                    className="w-full pl-9 pr-3 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green transition-colors"
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
                  {enviando ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
