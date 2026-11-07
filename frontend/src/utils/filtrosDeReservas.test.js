import { describe, expect, it } from 'vitest'
import { MENSAJES } from '../constants/messages.js'
import {
  FILTROS_VACIOS,
  ambienteMasUtilizado,
  consultaDeFiltros,
  filtrosDeBusqueda,
  hayFiltros,
  validarFiltros,
} from './filtrosDeReservas.js'
import { paginasVisibles, totalDePaginas } from './paginacion.js'

describe('paginación', () => {
  it.each([
    [0, 10, 1],
    [1, 10, 1],
    [10, 10, 1],
    [11, 10, 2],
    [23, 10, 3],
  ])(
    '%i reservas en páginas de %i → %i página(s) (nunca menos de 1)',
    (total, tamano, esperado) => {
      expect(totalDePaginas(total, tamano)).toBe(esperado)
    },
  )

  it.each([
    [1, 1, [1]],
    [1, 3, [1, 2, 3]],
    [2, 5, [1, 2, 3, 4, 5]],
    [1, 9, [1, 2, 3, '…', 9]],
    [5, 9, [1, 2, 3, 4, 5, 6, 7, 8, 9]], // un hueco de una sola página muestra esa página
    [6, 12, [1, '…', 4, 5, 6, 7, 8, '…', 12]],
    [9, 9, [1, '…', 7, 8, 9]],
  ])('desde la página %i de %i se muestran %j', (actual, total, esperado) => {
    expect(paginasVisibles(actual, total)).toEqual(esperado)
  })
})

describe('filtros de la lista de Reservas', () => {
  it('sin parámetros en la dirección todos los filtros están vacíos y la página es la 1', () => {
    expect(filtrosDeBusqueda(new URLSearchParams(''))).toEqual({ ...FILTROS_VACIOS, pagina: 1 })
    expect(hayFiltros(FILTROS_VACIOS)).toBe(false)
  })

  it('lee los filtros de la dirección y muestra las fechas como dd/mm/aaaa', () => {
    const buscar = new URLSearchParams(
      'estado=Pendiente&ambienteId=3&desde=2026-11-05&hasta=2026-11-30&pagina=2',
    )
    expect(filtrosDeBusqueda(buscar)).toEqual({
      estado: 'Pendiente',
      ambienteId: '3',
      desde: '05/11/2026',
      hasta: '30/11/2026',
      pagina: 2,
    })
    expect(hayFiltros(filtrosDeBusqueda(buscar))).toBe(true)
  })

  it.each(['0', '-2', 'abc', ''])('una página %j en la dirección se toma como la 1', (pagina) => {
    expect(filtrosDeBusqueda(new URLSearchParams(`pagina=${pagina}`)).pagina).toBe(1)
  })

  it('arma la dirección solo con lo que tiene valor, con las fechas en aaaa-mm-dd', () => {
    const filtros = {
      estado: 'Aprobada',
      ambienteId: '',
      desde: '05/11/2026',
      hasta: '',
      pagina: 1,
    }
    expect(consultaDeFiltros(filtros).toString()).toBe('estado=Aprobada&desde=2026-11-05')
  })

  it('la página 1 no se escribe; las demás sí', () => {
    expect(consultaDeFiltros({ ...FILTROS_VACIOS, pagina: 1 }).toString()).toBe('')
    expect(consultaDeFiltros({ ...FILTROS_VACIOS, pagina: 3 }).toString()).toBe('pagina=3')
  })

  it('una fecha escrita a medias no se manda', () => {
    expect(consultaDeFiltros({ ...FILTROS_VACIOS, desde: '05/11' }).toString()).toBe('')
  })
})

describe('validación de los filtros de fecha', () => {
  it('vacías o correctas no dan error (un filtro puede ser una fecha pasada)', () => {
    expect(validarFiltros({ desde: '', hasta: '' })).toEqual({ desde: null, hasta: null })
    expect(validarFiltros({ desde: '01/01/2020', hasta: '31/12/2020' })).toEqual({
      desde: null,
      hasta: null,
    })
  })

  it('una fecha mal escrita o que no existe da el mensaje del formato en su campo', () => {
    expect(validarFiltros({ desde: '05/11', hasta: '31/02/2026' })).toEqual({
      desde: MENSAJES.fechaFormatoInvalido,
      hasta: MENSAJES.fechaFormatoInvalido,
    })
  })

  it('la fecha final anterior a la inicial da el mensaje del rango en «hasta»', () => {
    expect(validarFiltros({ desde: '10/02/2030', hasta: '09/02/2030' })).toEqual({
      desde: null,
      hasta: MENSAJES.rangoDeFechasInvalido,
    })
  })

  it('el mismo día de inicio y de fin es un rango válido', () => {
    expect(validarFiltros({ desde: '10/02/2030', hasta: '10/02/2030' })).toEqual({
      desde: null,
      hasta: null,
    })
  })
})

describe('tarjeta de ambiente más utilizado', () => {
  it('un ambiente: su nombre y cuántas reservas aprobadas tiene', () => {
    expect(
      ambienteMasUtilizado([
        { ambienteId: 1, nombre: 'Laboratorio de Cómputo 2', reservasAprobadas: 14 },
      ]),
    ).toEqual({
      valor: 'Laboratorio de Cómputo 2',
      detalle: '14 reservas aprobadas',
      esEmpate: false,
      empatados: ['Laboratorio de Cómputo 2'],
    })
  })

  it('con una sola reserva aprobada el texto va en singular', () => {
    expect(
      ambienteMasUtilizado([{ ambienteId: 1, nombre: 'Auditorio Principal', reservasAprobadas: 1 }])
        .detalle,
    ).toBe('1 reserva aprobada')
  })

  it('en empate muestra texto «Empate: N ambientes con M reservas aprobadas» y lista de empatados', () => {
    expect(
      ambienteMasUtilizado([
        { ambienteId: 1, nombre: 'Auditorio Principal', reservasAprobadas: 3 },
        { ambienteId: 2, nombre: 'Laboratorio de Cómputo 2', reservasAprobadas: 3 },
      ]),
    ).toEqual({
      valor: 'Empate: 2 ambientes con 3 reservas aprobadas',
      detalle: '3 reservas aprobadas cada uno',
      esEmpate: true,
      empatados: ['Auditorio Principal', 'Laboratorio de Cómputo 2'],
    })
  })

  it('si no hay ninguna aprobada lo dice en lugar de dejar la tarjeta vacía', () => {
    expect(ambienteMasUtilizado([])).toEqual({
      valor: '—',
      detalle: 'Todavía no hay reservas aprobadas',
      esEmpate: false,
      empatados: [],
    })
  })
})
