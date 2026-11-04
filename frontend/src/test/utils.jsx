import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import { SESION_STORAGE_KEY } from '../services/sesionStorage.js'

export const SESIONES = {
  administrador: sesion('Carla Rojas', 'Administrador'),
  solicitante: sesion('Ana Torres', 'Solicitante'),
  responsable: sesion('Mario Huamán', 'Responsable'),
}

function sesion(nombreCompleto, rol) {
  return {
    token: `token-de-${rol}`,
    nombreCompleto,
    rol,
    expiraEn: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  }
}

export function iniciarSesionEnPrueba(sesionDePrueba) {
  sessionStorage.setItem(SESION_STORAGE_KEY, JSON.stringify(sesionDePrueba))
}

/** Muestra la ruta actual y el state recibido, para comprobar redirecciones. */
export function UbicacionActual() {
  const ubicacion = useLocation()
  return (
    <div data-testid="ubicacion" data-state={JSON.stringify(ubicacion.state)}>
      {ubicacion.pathname}
    </div>
  )
}

/** Renderiza `ui` dentro de un router en memoria y del proveedor de sesión. */
export function renderEnRuta(ui, { ruta = '/', sesionInicial, rutaDelElemento = '*' } = {}) {
  sessionStorage.clear()
  if (sesionInicial) iniciarSesionEnPrueba(sesionInicial)
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Routes>
          <Route path={rutaDelElemento} element={ui} />
        </Routes>
        <UbicacionActual />
      </AuthProvider>
    </MemoryRouter>,
  )
}

/** Renderiza la aplicación completa en una ruta, con la sesión indicada (o sin ella). */
export async function renderApp(ruta, sesionInicial) {
  const { default: App } = await import('../App.jsx')
  sessionStorage.clear()
  if (sesionInicial) iniciarSesionEnPrueba(sesionInicial)
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <App />
        <UbicacionActual />
      </AuthProvider>
    </MemoryRouter>,
  )
}
