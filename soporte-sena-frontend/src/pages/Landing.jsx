import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      <div className="bg-sena-green text-white px-4 pt-14 pb-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-24 h-24 rounded-full border-2 border-white/40" />
          <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full border-2 border-white/40" />
          <div className="absolute top-1/2 right-8 w-8 h-8 rounded-full bg-white/20" />
        </div>
        <div className="relative">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <svg viewBox="0 0 56 56" className="w-12 h-12" fill="none">
              <rect width="56" height="56" rx="12" fill="#39A900" />
              <text x="28" y="38" textAnchor="middle" fontSize="22" fontWeight="900" fill="white" fontFamily="Inter, sans-serif">S</text>
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight">SENA Soporte TI</h1>
          <p className="text-green-100 mt-1 text-sm">Servicio Nacional de Aprendizaje</p>
        </div>
      </div>

      <div className="px-4 mt-5 max-w-sm mx-auto w-full space-y-3">
        <button
          onClick={() => navigate('/reportar')}
          className="w-full bg-white rounded-2xl shadow-lg p-5 flex items-center gap-4 border-2 border-sena-green hover:shadow-xl hover:border-sena-dark transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 bg-sena-green rounded-xl flex items-center justify-center shadow-md shadow-green-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-base">Reportar novedad</p>
            <p className="text-xs text-gray-500">Informa un problema o daño</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/consultar')}
          className="w-full bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 border border-gray-100 hover:shadow-md hover:border-sena-green/30 transition-all"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-base">Consultar caso</p>
            <p className="text-xs text-gray-500">Verifica el estado de tu reporte</p>
          </div>
        </button>
      </div>

      <div className="mx-4 mt-5 max-w-sm mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" className="w-4 h-4">
              <path d="m10.29 3.86-8.27 14A2 2 0 0 0 3.74 21h16.52a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-800">¿Cómo reportar?</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">Selecciona el espacio donde estás, describe el problema y envía. Recibirás un número de caso para hacer seguimiento.</p>
          </div>
        </div>
      </div>

      <div className="mt-auto pb-10 pt-6 text-center">
        <button onClick={() => navigate('/login')} className="text-xs text-gray-400 hover:text-sena-green transition-colors font-medium underline underline-offset-2">
          Acceso para técnicos y administradores
        </button>
      </div>
    </div>
  )
}
