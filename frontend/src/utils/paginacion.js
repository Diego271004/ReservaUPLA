export const totalDePaginas = (total, tamano) => Math.max(1, Math.ceil(total / tamano))

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
