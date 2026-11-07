import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MENSAJES, TEXTOS, mensajeDominioNoInstitucional } from './messages.js'

// Los mensajes del frontend deben ser idénticos a los del backend (una sola fuente de verdad en cada lado).
const RUTA_CS = resolve(
  __dirname,
  '../../../backend/ReservaUPLA.Application/Common/MensajesValidacion.cs',
)
// Los mensajes de las reglas del dominio (RN-06) viven en MensajesDominio y MensajesValidacion los reexpone.
const RUTA_DOMINIO_CS = resolve(
  __dirname,
  '../../../backend/ReservaUPLA.Domain/Common/MensajesDominio.cs',
)

const aMinuscula = (nombre) => nombre.charAt(0).toLowerCase() + nombre.slice(1)

function leerMensajesDelDominio() {
  const dominio = {}
  for (const [, nombre, texto] of readFileSync(RUTA_DOMINIO_CS, 'utf8').matchAll(
    /public const string (\w+)\s*=\s*"([^"]*)";/g,
  )) {
    dominio[nombre] = texto
  }
  return dominio
}

function leerConstantesDelBackend() {
  const dominio = leerMensajesDelDominio()

  const codigo = readFileSync(RUTA_CS, 'utf8')
  const constantes = {}
  for (const [, nombre, texto] of codigo.matchAll(/public const string (\w+)\s*=\s*"([^"]*)";/g)) {
    constantes[aMinuscula(nombre)] = texto
  }
  // Alias: public const string X = MensajesDominio.Y;
  for (const [, nombre, origen] of codigo.matchAll(
    /public const string (\w+)\s*=\s*MensajesDominio\.(\w+);/g,
  )) {
    constantes[aMinuscula(nombre)] = dominio[origen]
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

  it('todos los mensajes de MensajesDominio existen idénticos en el frontend', () => {
    const dominio = Object.entries(leerMensajesDelDominio())
    expect(dominio.length).toBeGreaterThanOrEqual(3)
    const enElFrontend = new Set(Object.values(MENSAJES))
    const faltantes = dominio
      .filter(([, texto]) => !enElFrontend.has(texto))
      .map(([nombre]) => nombre)
    expect(faltantes).toEqual([])
  })

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

describe('textos de la interfaz con literales explícitos', () => {
  it('estados vacíos y textos orientadores con literales directos', () => {
    expect(TEXTOS.noHayDatos).toBe('Todavía no hay registros.')
    expect(TEXTOS.sinReservas).toBe(
      'Todavía no hay reservas. Crea la primera con «Reservar un ambiente».',
    )
    expect(TEXTOS.sinReservasResponsable).toBe('Todavía no hay reservas.')
    expect(TEXTOS.sinReservasConFiltros).toBe('No hay reservas con esos filtros.')
    expect(TEXTOS.sinPendientes).toBe('No hay solicitudes pendientes.')
    expect(TEXTOS.sinAmbienteAsignado).toBe(
      'Todavía no tienes un ambiente a cargo. Cuando se te asigne uno, aparecerá aquí.',
    )
    expect(TEXTOS.usoSinDatos).toBe('Todavía no hay reservas aprobadas.')
  })

  it('ayudas, avisos y microcopy humano con literales directos', () => {
    expect(TEXTOS.nombreProducto).toBe('ReservaUPLA')
    expect(TEXTOS.ayudaCorreo).toBe('Ejemplo: nombre.apellido@upla.edu.pe')
    expect(TEXTOS.ayudaSoporte).toBe('Comunícate con Soporte TI de la universidad')
    expect(TEXTOS.atajosAyudaHoraInicio).toBe('Elige primero la hora de inicio.')
    expect(TEXTOS.ayudaHorario).toBe('Horario permitido: 07:00 a 22:00')
    expect(TEXTOS.ayudaFechaFiltro).toBe('Formato dd/mm/aaaa. Vacía, no filtra.')
    expect(TEXTOS.solicitudesPendientes).toBe('Solicitudes pendientes de aprobación')
    expect(TEXTOS.requierenDecision).toBe('Requieren tu decisión')
    expect(TEXTOS.ambienteEnMantenimiento).toBe('En mantenimiento (no disponible)')
    expect(TEXTOS.ambienteEnMantenimientoAviso).toBe('El ambiente está en mantenimiento.')
    expect(TEXTOS.conflictoAprobada).toBe('Choca con una reserva ya aprobada.')
    expect(TEXTOS.menuAbrir).toBe('Menú')
    expect(TEXTOS.menuCerrar).toBe('Cerrar menú')
    expect(TEXTOS.menuContraer).toBe('Contraer menú')
    expect(TEXTOS.menuExpandir).toBe('Expandir menú')
  })
})
