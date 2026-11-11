export function resumenDeAmbientes(ambientes) {
  const total = ambientes.length
  const enMantenimiento = ambientes.filter((a) => a.estado !== 'Disponible').length
  const ambientesTexto = total === 1 ? '1 ambiente' : `${total} ambientes`
  return `${ambientesTexto} · ${enMantenimiento} en mantenimiento`
}

export function resumenDeUsuarios(usuarios) {
  const total = usuarios.length
  const activos = usuarios.filter((u) => u.activo).length
  const usuariosTexto = total === 1 ? '1 usuario' : `${total} usuarios`
  const activosTexto = activos === 1 ? '1 activo' : `${activos} activos`
  return `${usuariosTexto} · ${activosTexto}`
}
