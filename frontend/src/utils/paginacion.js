/** Cuántas páginas hacen falta para `total` elementos (siempre al menos 1: una lista vacía tiene la página 1). */
export const totalDePaginas = (total, tamano) => Math.max(1, Math.ceil(total / tamano))

/**
 * Los números de página que se dibujan: la primera, la última y las 2 de cada lado de la actual; los huecos de más de
 * una página se marcan con «…» (un hueco de una sola página muestra esa página).
 */
export function paginasVisibles(actual, total) {
  const visibles = new Set([1, total])
  for (let pagina = actual - 2; pagina <= actual + 2; pagina++) {
    if (pagina >= 1 && pagina <= total) visibles.add(pagina)
  }
  const orden = [...visibles].sort((a, b) => a - b)
  const resultado = []
  orden.forEach((pagina, i) => {
    const previa = orden[i - 1]
    if (previa !== undefined && pagina - previa === 2) resultado.push(previa + 1)
    else if (previa !== undefined && pagina - previa > 2) resultado.push('…')
    resultado.push(pagina)
  })
  return resultado
}
