import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout.jsx'
import { RUTA_INICIAL_POR_ROL } from './constants/navegacion.js'
import { RUTAS } from './constants/rutas.js'
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

function Inicio() {
  const { sesion } = useAuth()
  return (
    <Navigate to={sesion ? (RUTA_INICIAL_POR_ROL[sesion.rol] ?? '/login') : '/login'} replace />
  )
}

const PANTALLAS = {
  '/dashboard': DashboardPage,
  '/ambientes': AmbientesPage,
  '/ambientes/nuevo': AmbienteFormPage,
  '/usuarios': UsuariosPage,
  '/usuarios/nuevo': UsuarioFormPage,
  '/reservas/nueva': NuevaReservaPage,
  '/reservas': ReservasPage,
  '/reservas/:id': DetalleReservaPage,
  '/mi-ambiente': MiAmbientePage,
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route index element={<Inicio />} />
      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          {RUTAS.map(({ ruta, roles }) => {
            const Pantalla = PANTALLAS[ruta]
            return (
              <Route key={ruta} element={<RutaProtegida roles={roles} />}>
                <Route path={ruta} element={<Pantalla />} />
              </Route>
            )
          })}
          <Route path="*" element={<NoEncontradaPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
