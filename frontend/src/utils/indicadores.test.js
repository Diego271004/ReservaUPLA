import { describe, expect, it } from 'vitest'
import { indicadoresDeEstado } from './indicadores.js'

describe('indicadoresDeEstado', () => {
  it('arma las cuatro tarjetas en orden, con su número y su descripción', () => {
    expect(
      indicadoresDeEstado({ total: 48, pendientes: 7, aprobadas: 31, rechazadas: 10 }),
    ).toEqual([
      {
        clave: 'total',
        valor: 48,
        descripcion: 'Total de reservas',
        detalle: 'Incluye canceladas',
        icono: 'reservas',
        tono: 'info',
      },
      {
        clave: 'pendientes',
        valor: 7,
        descripcion: 'Reservas pendientes',
        icono: 'reloj',
        tono: 'aviso',
      },
      {
        clave: 'aprobadas',
        valor: 31,
        descripcion: 'Reservas aprobadas',
        icono: 'marca',
        tono: 'exito',
      },
      {
        clave: 'rechazadas',
        valor: 10,
        descripcion: 'Reservas rechazadas',
        icono: 'equis',
        tono: 'error',
      },
    ])
  })
})
