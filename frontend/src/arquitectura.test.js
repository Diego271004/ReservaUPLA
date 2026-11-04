import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

// Pruebas de arquitectura: reglas del código que se comprueban leyendo los archivos, no ejecutándolos.

const RAIZ = resolve(__dirname)
const esFuente = (nombre) => nombre.endsWith('.jsx') && !nombre.endsWith('.test.jsx')
const leer = (ruta) => ({
  nombre: relative(RAIZ, ruta).split(sep).join('/'),
  texto: readFileSync(ruta, 'utf8'),
})

/** Todos los .jsx (sin pruebas) de una carpeta de src, incluidas las subcarpetas. */
const archivos = (carpeta) =>
  readdirSync(join(RAIZ, carpeta), { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(carpeta, entrada.name)
    if (entrada.isDirectory()) return archivos(ruta)
    return esFuente(entrada.name) ? [leer(join(RAIZ, ruta))] : []
  })

// Etiquetas de formulario que las pantallas no pueden escribir: deben usar los componentes de src/components/ui.
const ETIQUETAS_DIRECTAS = /<(input|select|textarea|button)(?=[\s/>])/g
const COMPONENTE_QUE_LA_REEMPLAZA = {
  input: 'TextInput, PasswordInput, DateInput o InterruptorActivo',
  select: 'SelectInput o TimeInput',
  textarea: 'TextInput con la propiedad multilinea',
  button: 'Button',
}

describe('las pantallas (src/pages) usan los componentes de src/components/ui', () => {
  const paginas = archivos('pages')

  it('se encontraron las pantallas (la lectura de la carpeta funciona)', () => {
    expect(paginas.length).toBeGreaterThanOrEqual(8)
  })

  it.each(paginas.map(({ nombre, texto }) => [nombre, texto]))(
    '%s no usa <input>, <select>, <textarea> ni <button> directos',
    (nombre, texto) => {
      const infracciones = [...texto.matchAll(ETIQUETAS_DIRECTAS)].map(
        ([, etiqueta]) => `<${etiqueta}> (usa ${COMPONENTE_QUE_LA_REEMPLAZA[etiqueta]})`,
      )
      expect(infracciones, `${nombre} escribe etiquetas de formulario a mano`).toEqual([])
    },
  )
})

describe('fuera de src/components/ui nadie escribe etiquetas de formulario a mano', () => {
  // Todo .jsx de src salvo src/components/ui (donde viven esos componentes) y src/test (ayudas de las pruebas).
  const fuera = readdirSync(RAIZ, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory() && !['test', 'components'].includes(entrada.name))
    .flatMap((entrada) => archivos(entrada.name))
    .concat(
      readdirSync(join(RAIZ, 'components'), { withFileTypes: true })
        .filter((entrada) => entrada.isDirectory() && entrada.name !== 'ui')
        .flatMap((entrada) => archivos(join('components', entrada.name))),
      readdirSync(RAIZ)
        .filter(esFuente)
        .map((nombre) => leer(join(RAIZ, nombre))),
    )

  it('se encontraron los archivos (incluye Layout; la lectura de las carpetas funciona)', () => {
    const nombres = fuera.map(({ nombre }) => nombre)
    expect(nombres).toContain('components/Layout/Layout.jsx')
    expect(nombres).toContain('components/DetalleReserva/DetalleReserva.jsx')
    expect(nombres).toContain('App.jsx')
    expect(nombres.some((nombre) => nombre.startsWith('components/ui/'))).toBe(false)
  })

  it.each(fuera.map(({ nombre, texto }) => [nombre, texto]))(
    '%s no usa <input>, <select>, <textarea> ni <button> directos',
    (nombre, texto) => {
      const infracciones = [...texto.matchAll(ETIQUETAS_DIRECTAS)].map(
        ([, etiqueta]) => `<${etiqueta}> (usa ${COMPONENTE_QUE_LA_REEMPLAZA[etiqueta]})`,
      )
      expect(infracciones, `${nombre} escribe etiquetas de formulario a mano`).toEqual([])
    },
  )
})
