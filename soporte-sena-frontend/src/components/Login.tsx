import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, ChevronLeft, AlertCircle } from 'lucide-react'

interface Props {
  onSubmit: (email: string, password: string) => Promise<void>
  onBack: () => void
  onForgotPassword: () => void
}

export default function Login({ onSubmit, onBack, onForgotPassword }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales incorrectas. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      <div className="bg-sena-green text-white px-4 pt-12 pb-16">
        <button onClick={onBack} className="flex items-center gap-1.5 text-green-100 text-sm mb-6 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Volver
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
              <rect width="40" height="40" rx="8" fill="#39A900" />
              <text x="20" y="27" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white" fontFamily="sans-serif">S</text>
            </svg>
          </div>
          <div>
            <p className="text-green-100 text-xs font-medium uppercase tracking-wider">SENA</p>
            <p className="font-bold">Soporte Técnico</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold">Bienvenido</h1>
        <p className="text-green-100 text-sm mt-1">Inicia sesión para acceder al panel de gestión</p>
      </div>

      <div className="px-4 -mt-8 max-w-sm mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Correo electrónico</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@sena.edu.co"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sena-green/20 focus:border-sena-green transition-colors"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button type="button" onClick={onForgotPassword} className="text-xs text-sena-green font-semibold hover:underline">
                Recuperar contraseña
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-3 py-2.5 text-xs font-medium">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sena-green text-white py-3.5 rounded-xl font-bold text-sm hover:bg-sena-dark transition-colors disabled:opacity-70 shadow-md shadow-green-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 pb-10">
          Solo para técnicos y administradores SENA
        </p>
      </div>
    </div>
  )
}
