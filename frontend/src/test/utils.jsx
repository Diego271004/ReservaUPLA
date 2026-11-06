import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import { AvisosProvider } from '../context/AvisosContext.jsx'
import { SESION_STORAGE_KEY } from '../services/sesionStorage.js'

export const SESIONES = {
  administrador: sesion(1, 'Carla Rojas', 'Administrador'),
  solicitante: sesion(2, 'Ana Torres', 'Solicitante'),
  responsable: sesion(3, 'Mario Huamán', 'Responsable'),
}

function sesion(usuarioId, nombreCompleto, rol) {
  return {
    token: `token-de-${rol}`,
    usuarioId,
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
      {ubicacion.search}
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
        <AvisosProvider>
          <Routes>
            <Route path={rutaDelElemento} element={ui} />
          </Routes>
          <UbicacionActual />
        </AvisosProvider>
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
        <AvisosProvider>
          <App />
          <UbicacionActual />
        </AvisosProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}
