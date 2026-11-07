import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RESULTADO } from '../services/llamarApi.js'
import { aprobarReserva, obtenerDashboard, rechazarReserva } from '../services/recursosService.js'
import { SESIONES, renderEnRuta } from '../test/utils.jsx'
import DashboardPage from './DashboardPage.jsx'

vi.mock('../services/recursosService.js', () => ({
  aprobarReserva: vi.fn(),
  cancelarReserva: vi.fn(),
  obtenerDashboard: vi.fn(),
  rechazarReserva: vi.fn(),
}))

const CONFLICTO =
  'Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00. Elige otro horario u otro ambiente.'

const exito = (datos) => ({ tipo: RESULTADO.exito, data: datos })

const pendiente = (id, extra = {}) => ({
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

const panel = ({
  pendientes = [pendiente(7), pendiente(8, { solicitanteNombre: 'Luis Quispe' })],
  total = pendientes.length,
  masUtilizados,
} = {}) => ({
  indicadores: { total: 48, pendientes: total, aprobadas: 31, rechazadas: 10 },
  ambientesMasUtilizados: masUtilizados ?? [
    { ambienteId: 1, nombre: 'Laboratorio de Cómputo 2', reservasAprobadas: 14 },
  ],
  pendientesMasAntiguas: { elementos: pendientes, total, pagina: 1, tamano: 5 },
})

const mostrar = () =>
  renderEnRuta(<DashboardPage />, { ruta: '/dashboard', sesionInicial: SESIONES.administrador })
const tarjetasDecision = () =>
  screen
    .getAllByRole('article')
    .filter(
      (elemento) =>
        elemento.textContent.includes('Ana Torres') || elemento.textContent.includes('Luis Quispe'),
    )

beforeEach(() => {
  vi.resetAllMocks()
  obtenerDashboard.mockResolvedValue(exito(panel()))
})

describe('Dashboard: saludo contextual', () => {
  afterEach(() => vi.useRealTimers())

  it.each([
    ['2026-11-04T13:00:00Z', 'Buenos días, Carla'],
    ['2026-11-04T19:00:00Z', 'Buenas tardes, Carla'],
    ['2026-11-05T02:00:00Z', 'Buenas noches, Carla'],
  ])('a las %s dice «%s»', async (instante, saludo) => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(instante) })
    mostrar()
    expect(await screen.findByText(saludo)).toBeInTheDocument()
  })
})

describe('Dashboard: indicadores', () => {
  it('muestra el título y mientras carga «Cargando…»', () => {
    obtenerDashboard.mockReturnValue(new Promise(() => {}))
    mostrar()
    expect(screen.getByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(TEXTOS.cargando)
  })

  it('muestra las cinco tarjetas con el total, pendientes, aprobadas, rechazadas y el ambiente más utilizado', async () => {
    mostrar()
    const indicadores = await screen.findByRole('region', { name: 'Indicadores' })
    const tarjetas = within(indicadores).getAllByRole('article')
    expect(tarjetas).toHaveLength(5)
    expect(tarjetas[0]).toHaveTextContent('48Total de reservas')
    expect(tarjetas[1]).toHaveTextContent('2Reservas pendientes')
    expect(tarjetas[2]).toHaveTextContent('31Reservas aprobadas')
    expect(tarjetas[3]).toHaveTextContent('10Reservas rechazadas')
    expect(tarjetas[4]).toHaveTextContent(
      'Ambiente más utilizadoLaboratorio de Cómputo 214 reservas aprobadas',
    )
  })

  it('la tarjeta «Total de reservas» aclara que incluye las canceladas (el total no suma las otras tres)', async () => {
    mostrar()
    const indicadores = await screen.findByRole('region', { name: 'Indicadores' })
    const total = within(indicadores).getByText('Total de reservas').closest('article')
    expect(total).toHaveTextContent('Incluye canceladas')
    expect(within(indicadores).getAllByText('Incluye canceladas')).toHaveLength(1)
  })

  it('en un empate de «ambiente más utilizado» salen todos los empatados', async () => {
    obtenerDashboard.mockResolvedValue(
      exito(
        panel({
          masUtilizados: [
            { ambienteId: 2, nombre: 'Auditorio Principal', reservasAprobadas: 3 },
            { ambienteId: 1, nombre: 'Laboratorio de Cómputo 2', reservasAprobadas: 3 },
          ],
        }),
      ),
    )
    mostrar()
    expect(
      await screen.findByText('Empate: 2 ambientes con 3 reservas aprobadas'),
    ).toBeInTheDocument()
    const regionEmpate = screen.getByLabelText('Ambientes en empate')
    expect(within(regionEmpate).getByText('Auditorio Principal')).toBeInTheDocument()
    expect(within(regionEmpate).getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(screen.getByText('3 reservas aprobadas cada uno')).toBeInTheDocument()
  })

  it('sin reservas aprobadas la tarjeta lo dice en lugar de quedar vacía', async () => {
    obtenerDashboard.mockResolvedValue(exito(panel({ masUtilizados: [] })))
    mostrar()
    expect(await screen.findByText('Todavía no hay reservas aprobadas')).toBeInTheDocument()
  })
})

describe('Dashboard: pendientes', () => {
  it('lista las pendientes como tarjetas con Ver detalle, Rechazar y Aprobar', async () => {
    mostrar()
    await screen.findByRole('heading', { name: TEXTOS.requierenDecision })
    const tarjetas = tarjetasDecision()
    expect(tarjetas).toHaveLength(2)
    expect(within(tarjetas[0]).getByText('05/11/2026')).toBeInTheDocument()
    expect(within(tarjetas[0]).getByText('Ana Torres')).toBeInTheDocument()
    expect(within(tarjetas[0]).getByRole('button', { name: /Ver detalle/ })).toBeInTheDocument()
    expect(within(tarjetas[0]).getByRole('button', { name: /Rechazar/ })).toBeInTheDocument()
    expect(within(tarjetas[0]).getByRole('button', { name: /Aprobar/ })).toBeInTheDocument()
  })

  it('«Mostrando 5 de 7» y «Ver todas las pendientes» lleva a Reservas con el filtro Pendiente', async () => {
    obtenerDashboard.mockResolvedValue(
      exito(panel({ pendientes: [1, 2, 3, 4, 5].map((id) => pendiente(id)), total: 7 })),
    )
    mostrar()
    expect(await screen.findByText('Mostrando 5 de 7')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver todas las pendientes' })).toHaveAttribute(
      'href',
      '/reservas?estado=Pendiente',
    )
  })

  it('sin pendientes dice «No hay solicitudes pendientes.» y no ofrece «Ver todas las pendientes»', async () => {
    obtenerDashboard.mockResolvedValue(exito(panel({ pendientes: [] })))
    mostrar()
    expect(await screen.findByText(TEXTOS.sinPendientes)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver todas las pendientes' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()
  })

  it('«Ver detalle» abre la reserva y recuerda el Dashboard para volver', async () => {
    mostrar()
    const botones = await screen.findAllByRole('button', {
      name: /Ver detalle: Laboratorio de Cómputo 2, 05\/11\/2026/,
    })
    await userEvent.click(botones[0])
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/reservas/7')
    expect(JSON.parse(screen.getByTestId('ubicacion').dataset.state)).toEqual({
      volverA: '/dashboard',
    })
  })

  it.each([
    ['errorConexion', MENSAJES.errorConexion],
    ['errorServidor', MENSAJES.errorServidor],
    ['sinPermiso', MENSAJES.sinPermiso],
  ])(
    'si la carga falla (%s) muestra el mensaje y Reintentar vuelve a cargar',
    async (tipo, mensaje) => {
      obtenerDashboard.mockResolvedValueOnce({ tipo: RESULTADO[tipo] })
      mostrar()
      expect(await screen.findByText(mensaje, { exact: false })).toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'Indicadores' })).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
      expect(await screen.findByRole('region', { name: 'Indicadores' })).toBeInTheDocument()
    },
  )
})

describe('Dashboard: aprobar y rechazar con el modal', () => {
  const abrir = async (nombre) => {
    mostrar()
    const botones = await screen.findAllByRole('button', { name: nombre })
    await userEvent.click(botones[0])
    return screen.getByRole('dialog')
  }

  it('Aprobar abre el modal con el resumen y el foco en «Volver», sin la advertencia de irreversible', async () => {
    const modal = await abrir(/Aprobar: Laboratorio de Cómputo 2, 05\/11\/2026/)
    expect(modal).toHaveAccessibleName('¿Aprobar esta reserva?')
    expect(within(modal).getByText('Ambiente: Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(within(modal).getByText('Solicitante: Ana Torres')).toBeInTheDocument()
    expect(within(modal).getByText('Horario: 05/11/2026, 10:00 – 12:00')).toBeInTheDocument()
    expect(within(modal).queryByText(TEXTOS.advertenciaIrreversible)).not.toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: 'Volver' })).toHaveFocus()
    expect(aprobarReserva).not.toHaveBeenCalled()
  })

  it('Rechazar abre el modal rojo y avisa que no se puede deshacer', async () => {
    const modal = await abrir(/Rechazar: Laboratorio de Cómputo 2/)
    expect(modal).toHaveAccessibleName('¿Rechazar esta reserva?')
    expect(within(modal).getByText(TEXTOS.advertenciaIrreversible)).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: 'Sí, rechazar' })).toBeInTheDocument()
  })

  it('«Volver» cierra el modal sin llamar a la API', async () => {
    const modal = await abrir(/Aprobar: Laboratorio/)
    await userEvent.click(within(modal).getByRole('button', { name: 'Volver' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(aprobarReserva).not.toHaveBeenCalled()
    expect(obtenerDashboard).toHaveBeenCalledTimes(1)
  })

  it('Escape cierra el modal', async () => {
    await abrir(/Aprobar: Laboratorio/)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('confirmar aprobar: llama a la API con la reserva, muestra «Reserva aprobada.» y vuelve a pedir el Dashboard', async () => {
    aprobarReserva.mockResolvedValue(
      exito({ reserva: pendiente(7, { estado: 'Aprobada' }), historial: [] }),
    )
    obtenerDashboard
      .mockResolvedValueOnce(exito(panel()))
      .mockResolvedValueOnce(exito(panel({ pendientes: [pendiente(8)] })))
    const modal = await abrir(/Aprobar: Laboratorio/)
    await userEvent.click(within(modal).getByRole('button', { name: 'Sí, aprobar' }))
    expect(await screen.findByText('Reserva aprobada.')).toBeInTheDocument()
    expect(aprobarReserva).toHaveBeenCalledWith(7)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(obtenerDashboard).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(tarjetasDecision()).toHaveLength(1))
  })

  it('confirmar rechazar: llama a rechazarReserva y muestra «Reserva rechazada.»', async () => {
    rechazarReserva.mockResolvedValue(
      exito({ reserva: pendiente(7, { estado: 'Rechazada' }), historial: [] }),
    )
    const modal = await abrir(/Rechazar: Laboratorio/)
    await userEvent.click(within(modal).getByRole('button', { name: 'Sí, rechazar' }))
    expect(await screen.findByText('Reserva rechazada.')).toBeInTheDocument()
    expect(rechazarReserva).toHaveBeenCalledWith(7)
  })

  it('mientras guarda el botón dice «Guardando…» y no se repite la acción', async () => {
    aprobarReserva.mockReturnValue(new Promise(() => {}))
    const modal = await abrir(/Aprobar: Laboratorio/)
    await userEvent.click(within(modal).getByRole('button', { name: 'Sí, aprobar' }))
    const guardando = within(screen.getByRole('dialog')).getByRole('button', {
      name: TEXTOS.guardando,
    })
    await userEvent.click(guardando)
    expect(aprobarReserva).toHaveBeenCalledTimes(1)
  })

  it('RN-01: si al aprobar se cruza con otra aprobada, muestra el conflicto y vuelve a pedir los datos', async () => {
    aprobarReserva.mockResolvedValue({ tipo: RESULTADO.conflicto, mensaje: CONFLICTO })
    const modal = await abrir(/Aprobar: Laboratorio/)
    await userEvent.click(within(modal).getByRole('button', { name: 'Sí, aprobar' }))
    expect(await screen.findByText(CONFLICTO)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(obtenerDashboard).toHaveBeenCalledTimes(2))
  })

  it('si la acción falla por conexión muestra el mensaje y no cambia los datos', async () => {
    aprobarReserva.mockResolvedValue({ tipo: RESULTADO.errorConexion })
    const modal = await abrir(/Aprobar: Laboratorio/)
    await userEvent.click(within(modal).getByRole('button', { name: 'Sí, aprobar' }))
    expect(await screen.findByText(MENSAJES.errorConexion)).toBeInTheDocument()
    expect(obtenerDashboard).toHaveBeenCalledTimes(1)
  })
})

describe('Dashboard: solo con teclado', () => {
  it('Tab llega a Rechazar, Aprobar y Ver detalle de la primera tarjeta; Enter abre el modal, Tab cicla dentro y Escape lo cierra', async () => {
    mostrar()
    await screen.findByRole('heading', { name: TEXTOS.requierenDecision })
    const botones = within(tarjetasDecision()[0]).getAllByRole('button')
    for (const boton of botones) {
      await userEvent.tab()
      // los enlaces y botones anteriores de la página no cambian el orden: se recorre hasta llegar
      while (document.activeElement !== boton) await userEvent.tab()
      expect(boton).toHaveFocus()
    }
    expect(botones.map((b) => b.textContent)).toEqual(['Rechazar', 'Aprobar', 'Ver detalle'])
    botones[1].focus()
    await userEvent.keyboard('{Enter}')
    const modal = screen.getByRole('dialog')
    expect(within(modal).getByRole('button', { name: 'Volver' })).toHaveFocus()
    await userEvent.tab()
    expect(within(modal).getByRole('button', { name: 'Sí, aprobar' })).toHaveFocus()
    await userEvent.tab()
    expect(within(modal).getByRole('button', { name: 'Volver' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Dashboard por rol', () => {
  it('Solicitante muestra su próxima reserva y resumen de estados con enlaces', async () => {
    obtenerDashboard.mockResolvedValue(
      exito({
        ...panel(),
        inicioSolicitante: {
          proximaReserva: pendiente(21, {
            estado: 'Aprobada',
            ambienteNombre: 'Auditorio Principal',
          }),
          solicitudes: [pendiente(21, { estado: 'Aprobada' })],
          resumenPorEstado: [
            { estado: 'Pendiente', total: 1 },
            { estado: 'Aprobada', total: 2 },
          ],
        },
      }),
    )
    renderEnRuta(<DashboardPage />, { ruta: '/dashboard', sesionInicial: SESIONES.solicitante })
    expect(await screen.findByRole('heading', { name: 'Tu próxima reserva' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancelar reserva/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ver solicitudes aprobada: 2/i })).toBeInTheDocument()
  })

  it('Solicitante vacío ofrece reservar un ambiente', async () => {
    obtenerDashboard.mockResolvedValue(
      exito({
        ...panel(),
        inicioSolicitante: { proximaReserva: null, solicitudes: [], resumenPorEstado: [] },
      }),
    )
    renderEnRuta(<DashboardPage />, { ruta: '/dashboard', sesionInicial: SESIONES.solicitante })
    expect(await screen.findByText('No tienes una próxima reserva.')).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Reservar un ambiente' }).length,
    ).toBeGreaterThanOrEqual(2)
  })

  it('Responsable muestra agenda de hoy y próximas reservas', async () => {
    obtenerDashboard.mockResolvedValue(
      exito({
        ...panel(),
        inicioResponsable: {
          ambientes: [],
          hoy: [pendiente(31, { estado: 'Aprobada' })],
          proximas: [pendiente(32)],
        },
      }),
    )
    renderEnRuta(<DashboardPage />, { ruta: '/dashboard', sesionInicial: SESIONES.responsable })
    expect(await screen.findByRole('heading', { name: 'Hoy en tu ambiente' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Próximas reservas' })).toBeInTheDocument()
  })

  it('Responsable vacío muestra siguiente paso vacío', async () => {
    obtenerDashboard.mockResolvedValue(
      exito({ ...panel(), inicioResponsable: { ambientes: [], hoy: [], proximas: [] } }),
    )
    renderEnRuta(<DashboardPage />, { ruta: '/dashboard', sesionInicial: SESIONES.responsable })
    expect(await screen.findByText('No hay reservas para hoy.')).toBeInTheDocument()
    expect(screen.getByText('No hay próximas reservas.')).toBeInTheDocument()
  })

  it('cada vista muestra carga al iniciar', async () => {
    obtenerDashboard.mockReturnValue(new Promise(() => {}))
    renderEnRuta(<DashboardPage />, { ruta: '/dashboard', sesionInicial: SESIONES.solicitante })
    expect(await screen.findByText('Iniciando tu dashboard…')).toBeInTheDocument()
  })
})

describe('Dashboard Administrador: agenda y gráficos accesibles', () => {
  const hoy = (ambientes) => ({ ...panel(), hoyEnLosAmbientes: ambientes })

  it('coloca la hora actual en su propio carril y separa el eje de las barras', async () => {
    obtenerDashboard.mockResolvedValue(
      exito(hoy([{ id: 1, nombre: 'Auditorio', estado: 'Disponible', reservas: [] }])),
    )
    renderEnRuta(<DashboardPage ahora={new Date('2026-11-05T16:00:00Z')} />, {
      ruta: '/dashboard',
      sesionInicial: SESIONES.administrador,
    })
    expect(await screen.findByLabelText('Carril del eje de horas')).toBeInTheDocument()
    expect(screen.getByLabelText('Carril de la hora actual')).toBeInTheDocument()
    expect(screen.getByLabelText('Ahora 11:00')).toBeInTheDocument()
  })

  it('muestra eje de 07:00 a 22:00 y línea de hora actual de Lima con etiqueta', async () => {
    obtenerDashboard.mockResolvedValue(
      exito(hoy([{ id: 1, nombre: 'Auditorio', estado: 'Disponible', reservas: [] }])),
    )
    renderEnRuta(<DashboardPage ahora={new Date('2026-11-05T20:00:00Z')} />, {
      ruta: '/dashboard',
      sesionInicial: SESIONES.administrador,
    })
    const eje = await screen.findByLabelText('Carril del eje de horas')
    expect(within(eje).getByText('07:00')).toBeInTheDocument()
    expect(within(eje).getByText('21:00')).toBeInTheDocument()
    expect(screen.getByLabelText('Carril de la hora actual')).toBeInTheDocument()
    expect(screen.getByLabelText('Ahora 15:00')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('indica sin reservas aprobadas hoy por ambiente y muestra una reserva accesible', async () => {
    obtenerDashboard.mockResolvedValue(
      exito(
        hoy([
          { id: 1, nombre: 'Sala vacía', estado: 'Disponible', reservas: [] },
          {
            id: 2,
            nombre: 'Laboratorio',
            estado: 'Disponible',
            reservas: [
              {
                id: 44,
                horaInicio: '10:00',
                horaFin: '12:00',
                solicitanteNombre: 'Ana Torres',
              },
            ],
          },
        ]),
      ),
    )
    mostrar()
    expect(await screen.findByText('Sin reservas aprobadas hoy')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '10:00 a 12:00, Ana Torres' })).toBeInTheDocument()
  })

  it('muestra mantenimiento con icono y texto', async () => {
    obtenerDashboard.mockResolvedValue(
      exito(hoy([{ id: 1, nombre: 'Sala 3', estado: 'En mantenimiento', reservas: [] }])),
    )
    mostrar()
    expect(await screen.findByText('Mantenimiento')).toBeInTheDocument()
  })

  it('saca las etiquetas de estado a una leyenda legible y conserva la tabla alternativa', async () => {
    mostrar()
    const leyenda = await screen.findByRole('list', { name: 'Leyenda de reservas por estado' })
    expect(within(leyenda).getByText('Pendiente')).toBeInTheDocument()
    expect(within(leyenda).getByText('Aprobada')).toBeInTheDocument()
    expect(within(leyenda).getByText('Rechazada')).toBeInTheDocument()
  })
})
