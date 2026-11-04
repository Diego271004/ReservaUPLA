import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RESULTADO } from '../services/llamarApi.js'
import { listarAmbientes, listarReservas } from '../services/recursosService.js'
import { SESIONES, renderEnRuta } from '../test/utils.jsx'
import ReservasPage from './ReservasPage.jsx'

vi.mock('../services/recursosService.js', () => ({
  listarAmbientes: vi.fn(),
  listarReservas: vi.fn(),
}))

const exito = (datos) => ({ tipo: RESULTADO.exito, data: datos })

const reserva = (id, extra = {}) => ({
  id,
  ambienteId: 1,
  ambienteNombre: 'Laboratorio de Cómputo 2',
  usuarioId: 2,
  solicitanteNombre: 'Ana Torres',
  fecha: '2026-11-05',
  horaInicio: '10:00',
  horaFin: '12:00',
  motivo: 'Práctica',
  estado: 'Pendiente',
  ...extra,
})

const pagina = (elementos, total = elementos.length, numero = 1) => ({
  elementos,
  total,
  pagina: numero,
  tamano: 10,
})

const AMBIENTES = [
  { id: 1, nombre: 'Laboratorio de Cómputo 2' },
  { id: 2, nombre: 'Auditorio Principal' },
]

const mostrar = (ruta = '/reservas', sesion = SESIONES.administrador) =>
  renderEnRuta(<ReservasPage />, { ruta, sesionInicial: sesion })

const ultimaConsulta = () => listarReservas.mock.calls.at(-1)[0]
const control = (etiqueta) => screen.getByLabelText(etiqueta, { exact: true })

beforeEach(() => {
  vi.resetAllMocks()
  listarAmbientes.mockResolvedValue(exito(AMBIENTES))
  listarReservas.mockResolvedValue(exito(pagina([reserva(7), reserva(8, { estado: 'Aprobada' })])))
})

describe('Reservas: la lista', () => {
  it('mientras carga muestra «Cargando las reservas…»', () => {
    listarReservas.mockReturnValue(new Promise(() => {}))
    mostrar()
    expect(screen.getByRole('status')).toHaveTextContent(TEXTOS.cargandoReservas)
  })

  it('muestra el título, los encabezados, las filas con su insignia y «Ver detalle» en cada una', async () => {
    mostrar()
    expect(screen.getByRole('heading', { name: 'Reservas' })).toBeInTheDocument()
    const tabla = await screen.findByRole('table')
    for (const encabezado of [
      'Fecha',
      'Horario',
      'Ambiente',
      'Solicitante',
      'Estado',
      'Acciones',
    ]) {
      expect(within(tabla).getByRole('columnheader', { name: encabezado })).toBeInTheDocument()
    }
    expect(within(tabla).getAllByRole('row')).toHaveLength(3) // encabezado + 2 reservas
    expect(within(tabla).getAllByText('05/11/2026')).toHaveLength(2)
    expect(within(tabla).getAllByText('10:00 – 12:00')).toHaveLength(2)
    expect(within(tabla).getByText('Pendiente')).toBeInTheDocument()
    expect(within(tabla).getByText('Aprobada')).toBeInTheDocument()
    expect(within(tabla).getAllByRole('button', { name: /Ver detalle/ })).toHaveLength(2)
  })

  it('la Solicitante no ve la columna Solicitante (solo ve las suyas)', async () => {
    mostrar('/reservas', SESIONES.solicitante)
    const tabla = await screen.findByRole('table')
    expect(
      within(tabla).queryByRole('columnheader', { name: 'Solicitante' }),
    ).not.toBeInTheDocument()
    expect(within(tabla).getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument()
  })

  it('«Ver detalle» abre la reserva y recuerda la lista (filtros y página) para volver', async () => {
    mostrar('/reservas?estado=Pendiente&pagina=2')
    listarReservas.mockResolvedValue(exito(pagina([reserva(7)], 23, 2)))
    await userEvent.click((await screen.findAllByRole('button', { name: /Ver detalle/ }))[0])
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/reservas/7')
    expect(JSON.parse(screen.getByTestId('ubicacion').dataset.state)).toEqual({
      volverA: '/reservas?estado=Pendiente&pagina=2',
    })
  })

  it('pie con «Mostrando 2 de 2»', async () => {
    mostrar()
    expect(await screen.findByText('Mostrando 2 de 2')).toBeInTheDocument()
  })
})

describe('Reservas: los filtros', () => {
  it('muestra Estado, Ambiente, Fecha desde y Fecha hasta, con «Todos» y los ambientes de la API', async () => {
    mostrar()
    await screen.findByRole('table')
    expect(control('Estado')).toHaveValue('')
    expect(within(control('Estado')).getByRole('option', { name: 'Todos' })).toBeInTheDocument()
    for (const estado of ['Pendiente', 'Aprobada', 'Rechazada', 'Cancelada']) {
      expect(within(control('Estado')).getByRole('option', { name: estado })).toBeInTheDocument()
    }
    expect(
      await within(control('Ambiente')).findByRole('option', { name: 'Auditorio Principal' }),
    ).toBeInTheDocument()
    expect(control('Fecha desde')).toHaveValue('')
    expect(control('Fecha hasta')).toHaveAccessibleDescription(TEXTOS.ayudaFechaFiltro)
  })

  it('sin tocar nada la primera consulta no lleva filtros', async () => {
    mostrar()
    await screen.findByRole('table')
    expect(ultimaConsulta()).toEqual({
      estado: '',
      ambienteId: '',
      desde: '',
      hasta: '',
      pagina: 1,
    })
  })

  it('«Aplicar filtros» consulta con lo elegido y vuelve a la página 1', async () => {
    mostrar()
    await screen.findByRole('table')
    await within(control('Ambiente')).findByRole('option', { name: 'Auditorio Principal' })
    await userEvent.selectOptions(control('Estado'), 'Aprobada')
    await userEvent.selectOptions(control('Ambiente'), 'Auditorio Principal')
    await userEvent.type(control('Fecha desde'), '05112026')
    await userEvent.type(control('Fecha hasta'), '30112026')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await waitFor(() =>
      expect(ultimaConsulta()).toEqual({
        estado: 'Aprobada',
        ambienteId: '2',
        desde: '05/11/2026',
        hasta: '30/11/2026',
        pagina: 1,
      }),
    )
  })

  it('Enter en un campo aplica los filtros', async () => {
    mostrar()
    await screen.findByRole('table')
    await userEvent.type(control('Fecha desde'), '05112026{Enter}')
    await waitFor(() => expect(ultimaConsulta().desde).toBe('05/11/2026'))
  })

  it('lo que se escribe no consulta hasta aplicar', async () => {
    mostrar()
    await screen.findByRole('table')
    const antes = listarReservas.mock.calls.length
    await userEvent.selectOptions(control('Estado'), 'Rechazada')
    expect(listarReservas.mock.calls).toHaveLength(antes)
  })

  it('una fecha mal escrita avisa bajo su campo y no consulta', async () => {
    mostrar()
    await screen.findByRole('table')
    const antes = listarReservas.mock.calls.length
    await userEvent.type(control('Fecha desde'), '0511')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    expect(screen.getByText(MENSAJES.fechaFormatoInvalido)).toBeInTheDocument()
    expect(control('Fecha desde')).toHaveAttribute('aria-invalid', 'true')
    expect(listarReservas.mock.calls).toHaveLength(antes)
  })

  it('la fecha final anterior a la inicial avisa bajo «Fecha hasta»', async () => {
    mostrar()
    await screen.findByRole('table')
    await userEvent.type(control('Fecha desde'), '10022030')
    await userEvent.type(control('Fecha hasta'), '09022030')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    expect(screen.getByText(MENSAJES.rangoDeFechasInvalido)).toBeInTheDocument()
    expect(control('Fecha hasta')).toHaveAttribute('aria-invalid', 'true')
  })

  it('el error de una fecha desaparece al corregirla', async () => {
    mostrar()
    await screen.findByRole('table')
    await userEvent.type(control('Fecha desde'), '0511')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await userEvent.type(control('Fecha desde'), '2026')
    expect(screen.queryByText(MENSAJES.fechaFormatoInvalido)).not.toBeInTheDocument()
  })

  it('«Limpiar» borra los filtros y vuelve a consultar sin ellos', async () => {
    mostrar('/reservas?estado=Pendiente&desde=2026-11-05')
    await screen.findByRole('table')
    expect(control('Estado')).toHaveValue('Pendiente')
    expect(control('Fecha desde')).toHaveValue('05/11/2026')
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    await waitFor(() =>
      expect(ultimaConsulta()).toEqual({
        estado: '',
        ambienteId: '',
        desde: '',
        hasta: '',
        pagina: 1,
      }),
    )
    expect(control('Estado')).toHaveValue('')
    expect(control('Fecha desde')).toHaveValue('')
  })

  it('los filtros de la dirección (por ejemplo «Ver todas» del Dashboard) se aplican y se ven', async () => {
    mostrar('/reservas?estado=Pendiente')
    await screen.findByRole('table')
    expect(ultimaConsulta().estado).toBe('Pendiente')
    expect(control('Estado')).toHaveValue('Pendiente')
  })
})

describe('Reservas: filtros plegables en móvil', () => {
  const botonFiltros = () => screen.getByRole('button', { name: /^Filtros/ })
  const panel = () => document.getElementById(botonFiltros().getAttribute('aria-controls'))

  it('hay un botón «Filtros» del Button compartido, plegado al empezar, con aria-expanded y aria-controls', async () => {
    mostrar()
    await screen.findByRole('table')
    expect(botonFiltros()).toHaveTextContent(/^Filtros$/)
    expect(botonFiltros()).toHaveAttribute('aria-expanded', 'false')
    expect(panel()).toContainElement(control('Estado'))
    expect(panel().className).toMatch(/cerrado/)
  })

  it('al pulsarlo despliega los filtros y al volver a pulsarlo los pliega', async () => {
    mostrar()
    await screen.findByRole('table')
    await userEvent.click(botonFiltros())
    expect(botonFiltros()).toHaveAttribute('aria-expanded', 'true')
    expect(panel().className).not.toMatch(/cerrado/)
    await userEvent.click(botonFiltros())
    expect(botonFiltros()).toHaveAttribute('aria-expanded', 'false')
    expect(panel().className).toMatch(/cerrado/)
  })

  it.each([
    ['', 'Filtros'],
    ['?estado=Pendiente', 'Filtros (1)'],
    ['?estado=Pendiente&desde=2026-11-05', 'Filtros (2)'],
    ['?estado=Pendiente&ambienteId=1&desde=2026-11-05&hasta=2026-11-30', 'Filtros (4)'],
  ])(
    'con la dirección %j el botón dice «%s» (cuenta solo los filtros aplicados)',
    async (consulta, texto) => {
      mostrar(`/reservas${consulta}`)
      await screen.findByRole('table')
      expect(botonFiltros()).toHaveAccessibleName(texto)
    },
  )

  it('lo que se escribe sin aplicar no cambia el número del botón', async () => {
    mostrar()
    await screen.findByRole('table')
    await userEvent.click(botonFiltros())
    await userEvent.selectOptions(control('Estado'), 'Aprobada')
    expect(botonFiltros()).toHaveAccessibleName('Filtros')
  })

  it('al aplicar los filtros el panel vuelve a plegarse y el botón cuenta los aplicados', async () => {
    mostrar()
    await screen.findByRole('table')
    await userEvent.click(botonFiltros())
    await userEvent.selectOptions(control('Estado'), 'Aprobada')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await waitFor(() => expect(botonFiltros()).toHaveAccessibleName('Filtros (1)'))
    expect(botonFiltros()).toHaveAttribute('aria-expanded', 'false')
  })

  it('con un error de fecha el panel sigue desplegado para corregirlo', async () => {
    mostrar()
    await screen.findByRole('table')
    await userEvent.click(botonFiltros())
    await userEvent.type(control('Fecha desde'), '0511')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    expect(screen.getByText(MENSAJES.fechaFormatoInvalido)).toBeInTheDocument()
    expect(botonFiltros()).toHaveAttribute('aria-expanded', 'true')
  })

  it('solo con teclado: Tab llega al botón antes que a los campos y Enter y Espacio lo alternan', async () => {
    mostrar()
    await screen.findByRole('table')
    await userEvent.tab()
    expect(botonFiltros()).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(botonFiltros()).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard(' ')
    expect(botonFiltros()).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('Reservas: páginas', () => {
  it('con 23 reservas hay 3 páginas; en la primera «Anterior» está deshabilitado', async () => {
    listarReservas.mockResolvedValue(exito(pagina([reserva(1)], 23, 1)))
    mostrar()
    const navegacion = await screen.findByRole('navigation', { name: 'Paginación' })
    expect(within(navegacion).getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(within(navegacion).getByRole('button', { name: 'Página 3' })).toBeInTheDocument()
    expect(screen.getByText('Mostrando 1 de 23')).toBeInTheDocument()
  })

  it('«Siguiente» pide la página 2 conservando los filtros', async () => {
    listarReservas.mockResolvedValue(exito(pagina([reserva(1)], 23, 1)))
    mostrar('/reservas?estado=Aprobada')
    await userEvent.click(await screen.findByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(ultimaConsulta()).toMatchObject({ estado: 'Aprobada', pagina: 2 }))
  })

  it('con una sola página no hay paginación', async () => {
    mostrar()
    await screen.findByRole('table')
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument()
  })
})

describe('Reservas: estados vacío y de error', () => {
  it('sin reservas y sin filtros dice que todavía no hay ninguna, sin botón de limpiar', async () => {
    listarReservas.mockResolvedValue(exito(pagina([])))
    mostrar()
    const tabla = await screen.findByRole('table')
    expect(within(tabla).getByText(TEXTOS.sinReservas)).toBeInTheDocument()
    expect(within(tabla).queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()
  })

  it('con filtros y sin resultados ofrece «Limpiar filtros» dentro del bloque vacío', async () => {
    listarReservas.mockResolvedValue(exito(pagina([])))
    mostrar('/reservas?estado=Rechazada')
    const tabla = await screen.findByRole('table')
    expect(within(tabla).getByText(TEXTOS.sinReservasConFiltros)).toBeInTheDocument()
    listarReservas.mockResolvedValue(exito(pagina([reserva(7)])))
    await userEvent.click(within(tabla).getByRole('button', { name: 'Limpiar filtros' }))
    await waitFor(() => expect(ultimaConsulta().estado).toBe(''))
    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
  })

  it.each([
    ['errorConexion', MENSAJES.errorConexion],
    ['errorServidor', MENSAJES.errorServidor],
    ['sinPermiso', MENSAJES.sinPermiso],
  ])(
    'si la carga falla (%s) muestra el mensaje y Reintentar vuelve a pedir',
    async (tipo, mensaje) => {
      listarReservas.mockResolvedValueOnce({ tipo: RESULTADO[tipo] })
      mostrar()
      expect(await screen.findByText(mensaje, { exact: false })).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
      expect(await screen.findByRole('table')).toBeInTheDocument()
    },
  )
})

describe('Reservas: solo con teclado', () => {
  it('Tab recorre Estado, Ambiente, las dos fechas, Limpiar, Aplicar filtros y luego «Ver detalle»', async () => {
    mostrar()
    await screen.findByRole('table')
    const orden = [
      screen.getByRole('button', { name: /^Filtros/ }),
      control('Estado'),
      control('Ambiente'),
      control('Fecha desde'),
      control('Fecha hasta'),
      screen.getByRole('button', { name: 'Limpiar' }),
      screen.getByRole('button', { name: 'Aplicar filtros' }),
      screen.getAllByRole('button', { name: /Ver detalle/ })[0],
    ]
    for (const elemento of orden) {
      await userEvent.tab()
      expect(elemento).toHaveFocus()
    }
  })

  it('«Ver detalle» se activa con Enter', async () => {
    mostrar()
    const boton = (await screen.findAllByRole('button', { name: /Ver detalle/ }))[0]
    boton.focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/reservas/7')
  })
})
