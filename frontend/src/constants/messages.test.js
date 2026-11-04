import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MENSAJES, TEXTOS, mensajeDominioNoInstitucional } from './messages.js'

// Los mensajes del frontend deben ser idénticos a los del backend (una sola fuente de verdad en cada lado).
const RUTA_CS = resolve(
  __dirname,
  '../../../backend/ReservaUPLA.Application/Common/MensajesValidacion.cs',
)

function leerConstantesDelBackend() {
  const codigo = readFileSync(RUTA_CS, 'utf8')
  const constantes = {}
  for (const [, nombre, texto] of codigo.matchAll(/public const string (\w+)\s*=\s*"([^"]*)";/g)) {
    constantes[nombre.charAt(0).toLowerCase() + nombre.slice(1)] = texto
  }
  return constantes
}

describe('mensajes del frontend y del backend', () => {
  const backend = leerConstantesDelBackend()

  it('el backend define mensajes (la lectura del archivo funciona)', () => {
    expect(Object.keys(backend).length).toBeGreaterThan(40)
  })

  it.each(Object.entries(MENSAJES))(
    '"%s" es idéntico al de MensajesValidacion.cs',
    (clave, texto) => {
      expect(backend[clave], `falta ${clave} en MensajesValidacion.cs`).toBe(texto)
    },
  )

  it('todos los mensajes del backend existen también en el frontend', () => {
    const faltantes = Object.keys(backend).filter((clave) => !(clave in MENSAJES))
    expect(faltantes).toEqual([])
  })

  it('el mensaje de dominio no institucional es idéntico al del backend', () => {
    const codigo = readFileSync(RUTA_CS, 'utf8')
    expect(codigo).toContain('$"Usa tu correo institucional (termina en @{dominio}).";')
    expect(mensajeDominioNoInstitucional('upla.edu.pe')).toBe(
      'Usa tu correo institucional (termina en @upla.edu.pe).',
    )
  })

  it('ningún mensaje es ambiguo ni está vacío', () => {
    for (const texto of Object.values(MENSAJES)) {
      expect(texto.trim()).not.toBe('')
      expect(['Error', 'Datos incorrectos']).not.toContain(texto)
    }
  })
})

describe('textos de la interfaz', () => {
  it('usa solo el nombre "ReservaUPLA" y el ejemplo con el dominio @upla.edu.pe', () => {
    expect(TEXTOS.nombreProducto).toBe('ReservaUPLA')
    expect(TEXTOS.ayudaCorreo).toBe('Ejemplo: nombre.apellido@upla.edu.pe')
  })
})
