// Contraste MEDIDO del texto blanco del panel del login sobre la foto del campus con su capa marina (WCAG 1.4.3, 4,5:1).
// No se calcula con la opacidad declarada: se renderiza el login con el texto transparente, se captura el panel y se mira el
// píxel más claro (el peor caso: cielo y nubes) bajo cada texto y en toda la zona de la foto. Se repite a varios anchos de ventana.
import sharp from 'sharp'

const linealizar = (canal) => {
  const v = canal / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
export const luminancia = ([r, g, b]) => 0.2126 * linealizar(r) + 0.7152 * linealizar(g) + 0.0722 * linealizar(b)

/** Contraste del texto blanco sobre un píxel [r, g, b]. */
export const razonBlancoSobre = (pixel) => 1.05 / (luminancia(pixel) + 0.05)

/**
 * El píxel de una región (caja en píxeles de la imagen) que da el PEOR contraste con texto blanco, o sea el más claro.
 * `datos` es el búfer RGB(A) sin comprimir de la imagen y `canales` 3 o 4.
 */
export function peorPixel(datos, ancho, canales, caja) {
  let peor = { razon: Infinity, pixel: null }
  for (let y = Math.floor(caja.y); y < Math.ceil(caja.y + caja.alto); y++) {
    for (let x = Math.floor(caja.x); x < Math.ceil(caja.x + caja.ancho); x++) {
      const i = (y * ancho + x) * canales
      const pixel = [datos[i], datos[i + 1], datos[i + 2]]
      const razon = razonBlancoSobre(pixel)
      if (razon < peor.razon) peor = { razon, pixel }
    }
  }
  return peor
}

const VENTANAS = [
  { nombre: '1280x900', width: 1280, height: 900 },
  { nombre: '1920x1080', width: 1920, height: 1080 },
  { nombre: '1366x768', width: 1366, height: 768 },
  { nombre: '1024x600', width: 1024, height: 600 },
  { nombre: '768x1024', width: 768, height: 1024 },
]
const TEXTOS = [
  ['«ReservaUPLA»', '[data-testid="encabezado-panel"] p:nth-of-type(1)'],
  ['frase del panel', '[data-testid="encabezado-panel"] p:nth-of-type(2)'],
  ['«Universidad Peruana Los Andes»', 'aside > p'],
]

/** Mide a cada ancho de ventana: peor contraste bajo cada texto y en toda la zona de la foto. */
export async function medirContrasteSobreFoto(navegador, base) {
  const resultados = []
  for (const ventana of VENTANAS) {
    const contexto = await navegador.newContext({ viewport: { width: ventana.width, height: ventana.height } })
    const pagina = await contexto.newPage()
    await pagina.goto(`${base}/login`)
    await pagina.getByRole('button', { name: 'Ingresar' }).waitFor()
    await pagina.waitForTimeout(400)
    const cajas = await pagina.evaluate((textos) => {
      const panel = document.querySelector('aside').getBoundingClientRect()
      const fotoAlto = Math.min(panel.height, 768)
      return {
        panel: { x: panel.x, y: panel.y, ancho: panel.width, alto: panel.height },
        foto: { x: panel.x, y: panel.bottom - fotoAlto, ancho: panel.width - 4, alto: fotoAlto },
        textos: textos.map(([nombre, selector]) => {
          const r = document.querySelector(selector).getBoundingClientRect()
          return { nombre, x: r.x, y: r.y, ancho: r.width, alto: r.height }
        }),
      }
    }, TEXTOS)
    // Texto e imagen del logo invisibles: queda solo el fondo (marino, foto y capa) sobre el que se apoyaría el texto.
    await pagina.addStyleTag({ content: 'aside * { color: transparent !important; } aside img, aside .logo, aside span { visibility: hidden !important; }' })
    const png = await pagina.screenshot({ clip: { x: 0, y: 0, width: ventana.width, height: ventana.height } })
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
    const medidas = cajas.textos.map((t) => ({ nombre: t.nombre, ...peorPixel(data, info.width, info.channels, t) }))
    const zonaFoto = { nombre: 'toda la zona de la foto (cielo y nubes incluidos)', ...peorPixel(data, info.width, info.channels, cajas.foto) }
    resultados.push({ ventana: ventana.nombre, medidas: [...medidas, zonaFoto] })
    await contexto.close()
  }
  return resultados
}
