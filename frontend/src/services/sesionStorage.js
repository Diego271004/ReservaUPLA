export const SESION_STORAGE_KEY = 'reservaupla.sesion'

export function guardarSesion(sesion) {
  try {
    sessionStorage.setItem(SESION_STORAGE_KEY, JSON.stringify(sesion))
  } catch {
    // Sin almacenamiento de sesión la pantalla sigue funcionando
  }
}

export function leerSesion(ahora = Date.now()) {
  try {
    const texto = sessionStorage.getItem(SESION_STORAGE_KEY)
    if (!texto) return null
    const sesion = JSON.parse(texto)
    const valida =
      typeof sesion?.token === 'string' &&
      Number.isInteger(sesion.usuarioId) &&
      typeof sesion.nombreCompleto === 'string' &&
      typeof sesion.rol === 'string' &&
      Date.parse(sesion.expiraEn) > ahora
    return valida ? sesion : null
  } catch {
    return null
  }
}

export function borrarSesion() {
  try {
    sessionStorage.removeItem(SESION_STORAGE_KEY)
  } catch {
    // Sin almacenamiento de sesión la pantalla sigue funcionando
  }
}

export const obtenerToken = () => leerSesion()?.token ?? null
