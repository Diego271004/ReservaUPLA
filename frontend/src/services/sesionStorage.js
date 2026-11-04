// La sesión (token, nombre y rol) vive en sessionStorage: se borra al cerrar la pestaña.
export const SESION_STORAGE_KEY = 'reservaupla.sesion'

export function guardarSesion(sesion) {
  try {
    sessionStorage.setItem(SESION_STORAGE_KEY, JSON.stringify(sesion))
  } catch {
    // Almacenamiento no disponible (modo privado estricto): la sesión no persistirá al recargar.
  }
}

/** Devuelve la sesión guardada si tiene el formato esperado y no ha expirado; si no, null. */
export function leerSesion(ahora = Date.now()) {
  try {
    const texto = sessionStorage.getItem(SESION_STORAGE_KEY)
    if (!texto) return null
    const sesion = JSON.parse(texto)
    const valida =
      typeof sesion?.token === 'string' &&
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
    // Nada que borrar si el almacenamiento no está disponible.
  }
}

export const obtenerToken = () => leerSesion()?.token ?? null
