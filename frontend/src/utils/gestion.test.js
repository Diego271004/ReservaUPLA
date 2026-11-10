import { describe, expect, it } from 'vitest'
import { fraseDeActividad, ocupacionDeHoy, tasaDeAprobacion } from './gestion.js'

describe('tasaDeAprobacion: aprobadas sobre las ya decididas', () => {
  it('con 4 aprobadas y 1 rechazada es 80 %', () => {
    expect(tasaDeAprobacion({ aprobadas: 4, rechazadas: 1 })).toEqual({
      valor: '80 %',
      detalle: '4 de 5 solicitudes decididas',
    })
  })

  it('redondea al entero más cercano y llega a 0 % y a 100 %', () => {
    expect(tasaDeAprobacion({ aprobadas: 2, rechazadas: 1 }).valor).toBe('67 %')
    expect(tasaDeAprobacion({ aprobadas: 0, rechazadas: 3 }).valor).toBe('0 %')
    expect(tasaDeAprobacion({ aprobadas: 3, rechazadas: 0 }).valor).toBe('100 %')
  })

  it('sin solicitudes decididas no inventa un porcentaje', () => {
    expect(tasaDeAprobacion({ aprobadas: 0, rechazadas: 0 })).toEqual({
      valor: '—',
      detalle: 'Aún no hay solicitudes decididas',
    })
    expect(tasaDeAprobacion()).toMatchObject({ valor: '—' })
  })
})

describe('ocupacionDeHoy: horas aprobadas sobre las disponibles de los ambientes que no están en mantenimiento', () => {
  const agenda = [
    { estado: 'Disponible', reservas: [{ horaInicio: '10:00', horaFin: '12:00' }] },
    { estado: 'Disponible', reservas: [] },
    { estado: 'En mantenimiento', reservas: [] },
  ]

  it('2 h de 30 h disponibles (dos ambientes de 15 h) es 7 %', () => {
    expect(ocupacionDeHoy(agenda)).toEqual({
      valor: '7 %',
      detalle: '2 h reservadas de 30 h disponibles',
    })
  })

  it('el ambiente en mantenimiento no cuenta ni en el numerador ni en el denominador', () => {
    const conMantenimientoOcupado = [
      ...agenda,
      { estado: 'En mantenimiento', reservas: [{ horaInicio: '07:00', horaFin: '22:00' }] },
    ]
    expect(ocupacionDeHoy(conMantenimientoOcupado).valor).toBe('7 %')
  })

  it('muestra las medias horas con coma y recorta lo que sale del horario', () => {
    const resultado = ocupacionDeHoy([
      { estado: 'Disponible', reservas: [{ horaInicio: '06:00', horaFin: '09:30' }] },
    ])
    expect(resultado.detalle).toBe('2,5 h reservadas de 15 h disponibles')
    expect(resultado.valor).toBe('17 %')
  })

  it('sin ambientes disponibles o sin agenda no inventa un porcentaje', () => {
    expect(ocupacionDeHoy([{ estado: 'En mantenimiento', reservas: [] }]).valor).toBe('—')
    expect(ocupacionDeHoy()).toEqual({ valor: '—', detalle: 'No hay ambientes disponibles hoy' })
  })
})

describe('fraseDeActividad', () => {
  const base = { usuarioNombre: 'Carla Rojas', solicitanteNombre: 'Ana Torres' }

  it('dice quién hizo qué sobre la reserva de quién', () => {
    expect(fraseDeActividad({ ...base, estadoNuevo: 'Aprobada' })).toBe(
      'Carla Rojas aprobó la reserva de Ana Torres',
    )
    expect(fraseDeActividad({ ...base, estadoNuevo: 'Rechazada' })).toBe(
      'Carla Rojas rechazó la solicitud de Ana Torres',
    )
    expect(fraseDeActividad({ ...base, estadoNuevo: 'Cancelada' })).toBe(
      'Carla Rojas canceló la reserva de Ana Torres',
    )
  })

  it('una solicitud nueva la registra quien la pide', () => {
    expect(
      fraseDeActividad({
        usuarioNombre: 'Ana Torres',
        solicitanteNombre: 'Ana Torres',
        estadoNuevo: 'Pendiente',
      }),
    ).toBe('Ana Torres registró una solicitud')
  })

  it('quien cancela su propia reserva lo dice en primera persona del solicitante', () => {
    expect(
      fraseDeActividad({
        usuarioNombre: 'Ana Torres',
        solicitanteNombre: 'Ana Torres',
        estadoNuevo: 'Cancelada',
      }),
    ).toBe('Ana Torres canceló su reserva')
  })
})
