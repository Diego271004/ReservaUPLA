import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { MENSAJES } from './constants/messages.js'
import { MENU_POR_ROL, ROLES, RUTA_INICIAL_POR_ROL } from './constants/navegacion.js'
import { RUTAS } from './constants/rutas.js'
import { SESIONES, renderApp } from './test/utils.jsx'

const ROLES_VALIDOS = Object.values(ROLES)
const abrible = (ruta) => ruta.replace(':id', '7')
const puedeEntrar = (ruta, rol) => ruta.roles.includes(rol)
const ruta = (camino) => RUTAS.find((r) => r.ruta === camino)

/** ¿Llega el rol a esa pantalla sin escribir la dirección? Por el menú, por una subpantalla de una opción del menú o por un enlace. */
function seLlegaSinEscribirLaDireccion(rol, pantalla) {
  if (pantalla.contextual) return true
  return MENU_POR_ROL[rol].some(
    (opcion) =>
      opcion.ruta === pantalla.ruta ||
      (opcion.exacta === false && pantalla.ruta.startsWith(`${opcion.ruta}/`)),
  )
}

describe('estructura de la información: menú y rutas', () => {
  it('toda ruta protegida declara los roles que pueden entrar (una lista no vacía de roles válidos)', () => {
    for (const pantalla of RUTAS) {
      expect(Array.isArray(pantalla.roles), `${pantalla.ruta} sin lista de roles`).toBe(true)
      expect(pantalla.roles.length, `${pantalla.ruta} sin roles`).toBeGreaterThan(0)
      for (const rol of pantalla.roles) expect(ROLES_VALIDOS).toContain(rol)
    }
  })

  it('no hay dos rutas con la misma dirección y todas tienen título', () => {
    const direcciones = RUTAS.map((r) => r.ruta)
    expect(new Set(direcciones).size).toBe(direcciones.length)
    for (const pantalla of RUTAS) expect(pantalla.titulo, pantalla.ruta).toBeTruthy()
  })

  it.each(ROLES_VALIDOS)(
    '%s: cada opción de su menú apunta a una ruta que existe y a la que ese rol puede entrar',
    (rol) => {
      expect(MENU_POR_ROL[rol].length).toBeGreaterThan(0)
      for (const opcion of MENU_POR_ROL[rol]) {
        const destino = ruta(opcion.ruta)
        expect(destino, `el menú de ${rol} apunta a ${opcion.ruta}, que no existe`).toBeDefined()
        expect(destino.roles, `${rol} ve ${opcion.ruta} en el menú pero no puede entrar`).toContain(
          rol,
        )
      }
    },
  )

  it.each(ROLES_VALIDOS)('%s aterriza en una opción de su propio menú', (rol) => {
    const inicial = RUTA_INICIAL_POR_ROL[rol]
    expect(MENU_POR_ROL[rol].map((o) => o.ruta)).toContain(inicial)
  })

  it.each(ROLES_VALIDOS)(
    '%s no puede abrir por dirección una pantalla ajena a su menú sin recibir «Sin permiso»',
    (rol) => {
      const sueltas = RUTAS.filter(
        (r) => puedeEntrar(r, rol) && !seLlegaSinEscribirLaDireccion(rol, r),
      ).map((r) => r.ruta)
      expect(sueltas, `${rol} entra por dirección a pantallas que su menú no ofrece`).toEqual([])
    },
  )

  it('las rutas contextuales dicen desde qué pantallas se llega y esas pantallas existen', () => {
    const contextuales = RUTAS.filter((r) => r.contextual)
    expect(contextuales.length).toBeGreaterThan(0)
    for (const pantalla of contextuales) {
      expect(pantalla.desde?.length, `${pantalla.ruta} sin «desde»`).toBeGreaterThan(0)
      for (const origen of pantalla.desde) expect(ruta(origen), `${origen} no existe`).toBeDefined()
    }
  })

  it('cada rol que entra a una ruta contextual tiene, en su menú, una pantalla desde la que se llega', () => {
    for (const pantalla of RUTAS.filter((r) => r.contextual)) {
      for (const rol of pantalla.roles) {
        const origenes = pantalla.desde.filter((origen) => {
          const destino = ruta(origen)
          return destino.roles.includes(rol) && seLlegaSinEscribirLaDireccion(rol, destino)
        })
        expect(
          origenes,
          `${rol} puede entrar a ${pantalla.ruta} pero ningún enlace lo lleva`,
        ).not.toEqual([])
      }
    }
  })

  const denegadas = ROLES_VALIDOS.flatMap((rol) =>
    RUTAS.filter((r) => !puedeEntrar(r, rol)).map((r) => [rol, r.ruta]),
  )
  it.each(denegadas)('%s en %s ve «Sin permiso»', async (rol, camino) => {
    await renderApp(abrible(camino), SESIONES[rol.toLowerCase()])
    expect(screen.getByRole('heading', { name: 'Sin permiso' })).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.sinPermiso)).toBeInTheDocument()
  })
})
