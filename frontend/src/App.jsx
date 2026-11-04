import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout.jsx'
import { ROLES, RUTA_INICIAL_POR_ROL } from './constants/navegacion.js'
import { useAuth } from './context/AuthContext.jsx'
import AmbienteFormPage from './pages/AmbienteFormPage.jsx'
import AmbientesPage from './pages/AmbientesPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import DetalleReservaPage from './pages/DetalleReservaPage.jsx'
import { NoEncontradaPage } from './pages/ErrorRutaPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MiAmbientePage from './pages/MiAmbientePage.jsx'
import NuevaReservaPage from './pages/NuevaReservaPage.jsx'
import ReservasPage from './pages/ReservasPage.jsx'
import UsuarioFormPage from './pages/UsuarioFormPage.jsx'
import UsuariosPage from './pages/UsuariosPage.jsx'
import RutaProtegida from './routes/RutaProtegida.jsx'

const { administrador, solicitante, responsable } = ROLES

function Inicio() {
  const { sesion } = useAuth()
  return (
    <Navigate to={sesion ? (RUTA_INICIAL_POR_ROL[sesion.rol] ?? '/login') : '/login'} replace />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route index element={<Inicio />} />
      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route element={<RutaProtegida roles={[administrador]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ambientes" element={<AmbientesPage />} />
            <Route path="/ambientes/nuevo" element={<AmbienteFormPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/usuarios/nuevo" element={<UsuarioFormPage />} />
          </Route>
          <Route element={<RutaProtegida roles={[administrador, solicitante]} />}>
            <Route path="/reservas/nueva" element={<NuevaReservaPage />} />
          </Route>
          <Route element={<RutaProtegida roles={[administrador, solicitante, responsable]} />}>
            <Route path="/reservas" element={<ReservasPage />} />
            <Route path="/reservas/:id" element={<DetalleReservaPage />} />
          </Route>
          <Route element={<RutaProtegida roles={[responsable]} />}>
            <Route path="/mi-ambiente" element={<MiAmbientePage />} />
          </Route>
          <Route path="*" element={<NoEncontradaPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
