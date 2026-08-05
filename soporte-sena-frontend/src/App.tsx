import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAlertas } from './hooks/useAlertas'
import { useVersionCheck } from './hooks/useVersionCheck'
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

export default function App() {
  // Activa las alertas de casos nuevos (push + sonido en vivo) para el
  // personal logueado. Debe estar dentro de AuthProvider para leer la sesion.
  function AppConAlertas() {
    const alertas = useAlertas()
    const version = useVersionCheck()
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
