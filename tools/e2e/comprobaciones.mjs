// Comprobaciones de presentación que las pruebas de jsdom no pueden hacer (necesitan un navegador real).
import { ok, registrarResultado } from './lib.mjs'

/** Ningún texto de las celdas de las tablas se parte a mitad de palabra (cada palabra cabe en una línea). */
export async function sinPalabrasPartidas(pagina, nombre) {
  const partidas = await pagina.evaluate(() => {
    const resultado = []
    for (const celda of document.querySelectorAll('td')) {
      const texto = celda.firstChild?.nodeType === 3 ? celda.firstChild : null
      if (!texto) continue
      for (const palabra of new Set(texto.textContent.split(/\s+/).filter((p) => p.length > 5))) {
        const inicio = texto.textContent.indexOf(palabra)
        const rango = document.createRange()
        rango.setStart(texto, inicio)
        rango.setEnd(texto, inicio + palabra.length)
        const lineas = new Set([...rango.getClientRects()].map((r) => Math.round(r.top)))
        if (lineas.size > 1) resultado.push(palabra)
      }
    }
    return resultado
  })
  const hayPartidas = partidas.length > 0
  registrarResultado(`${nombre}-palabras`, hayPartidas)
  if (hayPartidas) console.log(`   FALLO  ${nombre}: palabras partidas a mitad: ${partidas.join(', ')}`)
  else ok(`${nombre}: ninguna palabra de las tablas se parte a mitad`)
}

/** La separación entre campos consecutivos del formulario es la misma (±2 px). */
export async function separacionUniforme(pagina, ids, nombre) {
  const huecos = await pagina.evaluate((lista) => {
    const caja = (id) => document.getElementById(id).getBoundingClientRect()
    const etiqueta = (id) => document.querySelector(`label[for="${id}"]`).getBoundingClientRect()
    return lista.slice(0, -1).map((id, i) => Math.round(etiqueta(lista[i + 1]).top - caja(id).bottom))
  }, ids)
  const desigual = Math.max(...huecos) - Math.min(...huecos) > 2
  registrarResultado(`${nombre}-separacion`, desigual)
  if (desigual) console.log(`   FALLO  ${nombre}: separación desigual entre campos (${huecos.join(', ')} px)`)
  else ok(`${nombre}: separación uniforme entre campos (${huecos.join(', ')} px)`)
}
