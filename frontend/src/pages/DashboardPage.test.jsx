import { beforeEach, describe, expect, it, vi } from 'vitest'
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
const fila = (numero) => within(screen.getByRole('table')).getAllByRole('row')[numero]

beforeEach(() => {
  vi.resetAllMocks()
  obtenerDashboard.mockResolvedValue(exito(panel()))
})

describe('Dashboard: indicadores', () => {
  it('muestra el título y mientras carga «Cargando…»', () => {
    obtenerDashboard.mockReturnValue(new Promise(() => {}))
    mostrar()
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
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
      'Laboratorio de Cómputo 2Ambiente más utilizado14 reservas aprobadas',
    )
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
      await screen.findByText('Auditorio Principal y Laboratorio de Cómputo 2'),
    ).toBeInTheDocument()
    expect(screen.getByText('3 reservas aprobadas cada uno')).toBeInTheDocument()
  })

  it('sin reservas aprobadas la tarjeta lo dice en lugar de quedar vacía', async () => {
    obtenerDashboard.mockResolvedValue(exito(panel({ masUtilizados: [] })))
    mostrar()
    expect(await screen.findByText('Todavía no hay reservas aprobadas')).toBeInTheDocument()
  })
})

describe('Dashboard: pendientes', () => {
  it('lista las pendientes con Ver detalle, Rechazar y Aprobar en cada fila', async () => {
    mostrar()
    await screen.findByRole('table', { name: TEXTOS.solicitudesPendientes })
    expect(within(fila(1)).getByText('05/11/2026')).toBeInTheDocument()
    expect(within(fila(1)).getByText('Ana Torres')).toBeInTheDocument()
    expect(within(fila(1)).getByRole('button', { name: /Ver detalle/ })).toBeInTheDocument()
    expect(within(fila(1)).getByRole('button', { name: /Rechazar/ })).toBeInTheDocument()
    expect(within(fila(1)).getByRole('button', { name: /Aprobar/ })).toBeInTheDocument()
    expect(within(fila(2)).getByText('Luis Quispe')).toBeInTheDocument()
  })

  it('«Mostrando 5 de 7» y «Ver todas» lleva a Reservas con el filtro Pendiente', async () => {
    obtenerDashboard.mockResolvedValue(
      exito(panel({ pendientes: [1, 2, 3, 4, 5].map((id) => pendiente(id)), total: 7 })),
    )
    mostrar()
    expect(await screen.findByText('Mostrando 5 de 7')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver todas' })).toHaveAttribute(
      'href',
      '/reservas?estado=Pendiente',
    )
  })

  it('sin pendientes dice «No hay solicitudes pendientes.» y no ofrece «Ver todas»', async () => {
    obtenerDashboard.mockResolvedValue(exito(panel({ pendientes: [] })))
    mostrar()
    expect(await screen.findByText(TEXTOS.sinPendientes)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver todas' })).not.toBeInTheDocument()
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
    await waitFor(() =>
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2),
    )
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
  it('Tab llega a Ver detalle, Rechazar y Aprobar de la primera fila; Enter abre el modal, Tab cicla dentro y Escape lo cierra', async () => {
    mostrar()
    await screen.findByRole('table')
    const botones = within(fila(1)).getAllByRole('button')
    for (const boton of botones) {
      await userEvent.tab()
      // los enlaces y botones anteriores de la página no cambian el orden: se recorre hasta llegar
      while (document.activeElement !== boton) await userEvent.tab()
      expect(boton).toHaveFocus()
    }
    expect(botones.map((b) => b.textContent)).toEqual(['Ver detalle', 'Rechazar', 'Aprobar'])
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
