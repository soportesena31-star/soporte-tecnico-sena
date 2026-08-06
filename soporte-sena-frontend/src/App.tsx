import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAlertas } from './hooks/useAlertas'
import { useVersionCheck } from './hooks/useVersionCheck'
import { useGuardiaSesion } from './hooks/useGuardiaSesion'
import BannerNotificaciones from './components/BannerNotificaciones'
import VersionBanner from './components/VersionBanner'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import ReportarPage from './pages/ReportarPage'
import ConfirmacionPage from './pages/ConfirmacionPage'
import ConsultarPage from './pages/ConsultarPage'
import LoginPage from './pages/LoginPage'
import AceptarInvitacionPage from './pages/AceptarInvitacionPage'
import OlvidePasswordPage from './pages/OlvidePasswordPage'
import RestablecerPasswordPage from './pages/RestablecerPasswordPage'
import TecnicoPage from './pages/TecnicoPage'
import CasoDetallePage from './pages/CasoDetallePage'

// AdminPage carga recharts, la dependencia mas pesada del proyecto. La
// mayoria de las visitas son para reportar o resolver casos, asi que ese
// bundle no se descarga a menos que alguien realmente entre al panel admin.
const AdminPage = lazy(() => import('./pages/AdminPage'))

function CargandoPantallaCompleta() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-sena-green border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function DialogoSesion({
  modo,
  onCancelar,
  onContinuar,
  onCerrar,
}: {
  modo: 'atras' | 'inactividad'
  onCancelar: () => void
  onContinuar: () => void
  onCerrar: () => void
}) {
  const esInactividad = modo === 'inactividad'
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onClick={esInactividad ? undefined : onCancelar}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="w-12 h-12 rounded-full bg-sena-green/10 flex items-center justify-center mb-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sena-green">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800">
          {esInactividad ? '30 minutos sin actividad' : '¿Quieres cerrar sesión?'}
        </h2>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          {esInactividad
            ? 'Tu sesión está a punto de cerrarse por inactividad. ¿Deseas continuar trabajando?'
            : 'Presionaste el botón atrás fuera de la app. Tu sesión sigue activa; puedes continuar donde estabas.'}
        </p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={esInactividad ? onContinuar : onCancelar}
            className="flex-1 bg-sena-green text-white py-3 rounded-xl font-bold text-sm hover:bg-sena-dark transition-colors"
          >
            {esInactividad ? 'Continuar sesión' : 'Permanecer en la app'}
          </button>
          <button
            onClick={onCerrar}
            className="flex-1 bg-white text-red-600 py-3 rounded-xl font-bold text-sm border-2 border-red-200 hover:bg-red-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  // Activa las alertas de casos nuevos (push + sonido en vivo) para el
  // personal logueado. Debe estar dentro de AuthProvider para leer la sesion.
  function AppConAlertas() {
    const alertas = useAlertas()
    const version = useVersionCheck()
    const guardia = useGuardiaSesion()
    return (
      <>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/reportar" element={<ReportarPage />} />
          <Route path="/confirmacion" element={<ConfirmacionPage />} />
          <Route path="/consultar" element={<ConsultarPage />} />
          <Route path="/consultar/:numeroCaso" element={<ConsultarPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invitacion/:token" element={<AceptarInvitacionPage />} />
          <Route path="/olvide-password" element={<OlvidePasswordPage />} />
          <Route path="/restablecer/:token" element={<RestablecerPasswordPage />} />

          <Route path="/casos" element={<ProtectedRoute rolRequerido="Técnico"><TecnicoPage /></ProtectedRoute>} />
          <Route path="/casos/:numeroCaso" element={<ProtectedRoute rolRequerido="Técnico"><CasoDetallePage /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute rolRequerido="Administrador"><Suspense fallback={<CargandoPantallaCompleta />}><AdminPage /></Suspense></ProtectedRoute>} />

          <Route path="*" element={<Landing />} />
        </Routes>
        <BannerNotificaciones {...alertas} />
        <VersionBanner {...version} />
        {guardia.dialogo && (
          <DialogoSesion
            modo={guardia.dialogo}
            onCancelar={guardia.cancelar}
            onContinuar={guardia.continuarSesion}
            onCerrar={guardia.confirmarCerrar}
          />
        )}
      </>
    )
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppConAlertas />
      </AuthProvider>
    </BrowserRouter>
  )
}
