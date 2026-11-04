import { describe, expect, it } from 'vitest'
import { MENSAJES } from '../constants/messages.js'
import { accionesDeReserva, fechaHoraLocal, textoDeEvento } from './reservas.js'

const reserva = (estado, usuarioId = 2) => ({ estado, usuarioId })
const administrador = { rol: 'Administrador', usuarioId: 1 }
const solicitante = { rol: 'Solicitante', usuarioId: 2 }
const otraSolicitante = { rol: 'Solicitante', usuarioId: 9 }
const responsable = { rol: 'Responsable', usuarioId: 3 }

describe('accionesDeReserva (RN-05 y RN-06 en la interfaz)', () => {
  it('Administrador con una reserva Pendiente: cancelar, rechazar y aprobar, habilitados y sin aviso', () => {
    const resultado = accionesDeReserva(administrador, reserva('Pendiente'))
    expect(resultado.acciones).toEqual([
      { id: 'cancelar', texto: 'Cancelar reserva', habilitada: true },
      { id: 'rechazar', texto: 'Rechazar', habilitada: true },
      { id: 'aprobar', texto: 'Aprobar', habilitada: true },
    ])
    expect(resultado.aviso).toBeNull()
  })

  it('Administrador con una reserva Aprobada: solo cancelar', () => {
    const resultado = accionesDeReserva(administrador, reserva('Aprobada'))
    expect(resultado.acciones).toEqual([
      { id: 'cancelar', texto: 'Cancelar reserva', habilitada: true },
    ])
    expect(resultado.aviso).toBeNull()
  })

  it.each([
    ['Rechazada', MENSAJES.reservaRechazadaNoSeModifica],
    ['Cancelada', MENSAJES.reservaCanceladaNoSeModifica],
  ])('RN-06: Administrador con una reserva %s: todo deshabilitado y con aviso', (estado, aviso) => {
    const resultado = accionesDeReserva(administrador, reserva(estado))
    expect(resultado.acciones.map((accion) => accion.id)).toEqual([
      'cancelar',
      'rechazar',
      'aprobar',
    ])
    expect(resultado.acciones.every((accion) => accion.habilitada === false)).toBe(true)
    expect(resultado.aviso).toBe(aviso)
  })

  it.each(['Pendiente', 'Aprobada'])(
    'RN-05: la Solicitante dueña solo cancela su solicitud (%s)',
    (estado) => {
      const resultado = accionesDeReserva(solicitante, reserva(estado))
      expect(resultado.acciones).toEqual([
        { id: 'cancelar', texto: 'Cancelar solicitud', habilitada: true },
      ])
    },
  )

  it('RN-06: la Solicitante con una reserva Rechazada ve el aviso y la acción deshabilitada', () => {
    const resultado = accionesDeReserva(solicitante, reserva('Rechazada'))
    expect(resultado.acciones).toEqual([
      { id: 'cancelar', texto: 'Cancelar solicitud', habilitada: false },
    ])
    expect(resultado.aviso).toBe(MENSAJES.reservaRechazadaNoSeModifica)
  })

  it('RN-05: una Solicitante que no es la dueña no ve acciones', () => {
    expect(accionesDeReserva(otraSolicitante, reserva('Pendiente'))).toEqual({
      acciones: [],
      aviso: null,
    })
  })

  it.each(['Pendiente', 'Aprobada', 'Rechazada', 'Cancelada'])(
    'RN-05: la Responsable nunca ve acciones (%s)',
    (estado) => {
      expect(accionesDeReserva(responsable, reserva(estado))).toEqual({ acciones: [], aviso: null })
    },
  )

  it('nadie ve Aprobar ni Rechazar salvo el Administrador', () => {
    for (const actor of [solicitante, otraSolicitante, responsable]) {
      for (const estado of ['Pendiente', 'Aprobada', 'Rechazada', 'Cancelada']) {
        const ids = accionesDeReserva(actor, reserva(estado)).acciones.map((accion) => accion.id)
        expect(ids).not.toContain('aprobar')
        expect(ids).not.toContain('rechazar')
      }
    }
  })
})

describe('historial', () => {
  const fecha = new Date(2026, 10, 3, 9, 5).toISOString()

  it('fechaHoraLocal da dd/mm/aaaa HH:mm con dos dígitos', () => {
    expect(fechaHoraLocal(fecha)).toBe('03/11/2026 09:05')
  })

  it.each([
    [null, 'Pendiente', 'Solicitud registrada por Ana Torres, 03/11/2026 09:05'],
    ['Pendiente', 'Aprobada', 'Reserva aprobada por Ana Torres, 03/11/2026 09:05'],
    ['Pendiente', 'Rechazada', 'Reserva rechazada por Ana Torres, 03/11/2026 09:05'],
    ['Aprobada', 'Cancelada', 'Reserva cancelada por Ana Torres, 03/11/2026 09:05'],
  ])('un evento %s → %s se cuenta en una frase', (anterior, nuevo, frase) => {
    expect(
      textoDeEvento({
        estadoAnterior: anterior,
        estadoNuevo: nuevo,
        usuarioNombre: 'Ana Torres',
        fecha,
      }),
    ).toBe(frase)
  })
})
