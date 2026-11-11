export async function comprobarSinRecorteDisponibilidad(pagina, ancho) {
  const fallos = await pagina.evaluate(() => {
    const bloques = document.querySelectorAll('[class*="bloque"], [class*="itemMovil"]')
    const res = []
    for (const bloque of bloques) {
      if (bloque.offsetWidth === 0 && bloque.offsetHeight === 0) continue
      const spans = bloque.querySelectorAll('span')
      const elementos = spans.length > 0 ? Array.from(spans) : [bloque]
      for (const el of elementos) {
        if (el.offsetWidth === 0 && el.offsetHeight === 0) continue
        const texto = el.textContent?.trim()
        if (!texto) continue
        if (el.scrollWidth > el.clientWidth + 1) {
          const fila = el.closest('[class*="filaAmbiente"], [class*="tarjetaAmbiente"]')
          const ambiente =
            fila?.querySelector('[class*="nombreAmbiente"], h2')?.textContent?.trim() || 'Ambiente'
          const horario =
            bloque.getAttribute('aria-label') ||
            bloque.getAttribute('title') ||
            texto
          res.push({
            ambiente,
            horario,
            texto,
            scrollWidth: Math.round(el.scrollWidth),
            clientWidth: Math.round(el.clientWidth),
            exceso: Math.round(el.scrollWidth - el.clientWidth),
          })
        }
      }
    }
    return res
  })

  if (fallos.length > 0) {
    const detalle = fallos
      .map(
        (f) =>
          `  - ${f.ambiente} | ${f.horario} | texto "${f.texto}": scrollWidth ${f.scrollWidth}px > clientWidth ${f.clientWidth}px (+${f.exceso}px)`,
      )
      .join('\n')
    throw new Error(
      `Defecto de texto cortado (scrollWidth > clientWidth) a ${ancho}px:\n${detalle}`,
    )
  }
  return fallos
}
