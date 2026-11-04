import assert from 'node:assert/strict'
import { test } from 'node:test'
import { diagramaDeEstructura, leerEstructura, tablaDeRutas } from '../mapa-del-sitio.mjs'

test('la tabla trae cada ruta del código, con sus roles y cómo se llega', async () => {
  const estructura = await leerEstructura()
  const tabla = tablaDeRutas(estructura)
  for (const r of estructura.RUTAS) assert.ok(tabla.includes(`\`${r.ruta}\``), `falta ${r.ruta}`)
  assert.match(tabla, /`\/reservas\/:id`.*Enlace desde/)
  assert.match(tabla, /`\/ambientes\/nuevo`.*Botón dentro de la pantalla del menú/)
})

test('cada opción del menú aparece en el diagrama de su rol', async () => {
  const estructura = await leerEstructura()
  const diagrama = diagramaDeEstructura(estructura)
  for (const [rol, menu] of Object.entries(estructura.MENU_POR_ROL)) {
    for (const opcion of menu) {
      const id = `${rol[0]}${opcion.ruta.replace(/[^a-z]/gi, '_')}`
      assert.ok(diagrama.includes(`${id}[`), `${rol}: falta ${opcion.ruta}`)
    }
  }
})

test('el diagrama conecta el login con la pantalla inicial de cada rol', async () => {
  const estructura = await leerEstructura()
  const diagrama = diagramaDeEstructura(estructura)
  for (const [rol, inicial] of Object.entries(estructura.RUTA_INICIAL_POR_ROL)) {
    assert.ok(diagrama.includes(`LOGIN --> ${rol[0]}${inicial.replace(/[^a-z]/gi, '_')}`))
  }
})
