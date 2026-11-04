// Consulta GET /api/salud. Devuelve true si la API y la base de datos responden.
export async function consultarSalud() {
  try {
    const respuesta = await fetch('/api/salud')
    return respuesta.ok
  } catch {
    return false
  }
}
