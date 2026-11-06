import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TEXTOS } from './constants/messages.js'
import { RESULTADO } from './services/llamarApi.js'
import { listarAmbientes, listarUsuarios } from './services/recursosService.js'
import { SESIONES, renderApp } from './test/utils.jsx'

vi.mock('./services/recursosService.js', () => ({
  aprobarReserva: vi.fn(),
  cancelarReserva: vi.fn(),
  consultarDisponibilidad: vi.fn(),
  crearAmbiente: vi.fn(),
  crearReserva: vi.fn(),
  crearUsuario: vi.fn(),
  listarAmbientes: vi.fn(),
  obtenerDisponibilidadDia: vi.fn(),
  listarReservas: vi.fn(),
  listarUsuarios: vi.fn(),
  obtenerDashboard: vi.fn(),
  obtenerMiAmbiente: vi.fn(),
  obtenerReserva: vi.fn(),
  rechazarReserva: vi.fn(),
}))

beforeEach(() => {
  vi.resetAllMocks()
  listarAmbientes.mockResolvedValue({ tipo: RESULTADO.exito, data: [] })
  listarUsuarios.mockResolvedValue({ tipo: RESULTADO.exito, data: [] })
})

const nombres = () => screen.getAllByRole('button').map((boton) => boton.textContent)

describe('«Nuevo X» abre el formulario; «Registrar X» lo envía', () => {
  it.each([
    ['/ambientes', 'Nuevo ambiente', 'Registrar ambiente'],
    ['/usuarios', 'Nuevo usuario', 'Registrar usuario'],
  ])(
    '%s: el botón «%s» abre el formulario cuyo botón principal es «%s» y el secundario «Volver»',
    async (ruta, nuevo, registrar) => {
      await renderApp(ruta, SESIONES.administrador)
      await userEvent.click(await screen.findByRole('button', { name: nuevo }))
      expect(await screen.findByRole('heading', { name: registrar })).toBeInTheDocument()
      expect(nombres()).toEqual(expect.arrayContaining([registrar, 'Volver']))
      expect(nombres().filter((n) => /^(Cancelar|Guardar)/.test(n))).toEqual([])
    },
  )

  it('/reservas/nueva: «Registrar solicitud» envía y «Limpiar formulario» vacía; ninguno dice «Cancelar»', async () => {
    await renderApp('/reservas/nueva', SESIONES.solicitante)
    await screen.findByRole('heading', { name: 'Nueva reserva' })
    expect(nombres()).toEqual(expect.arrayContaining(['Registrar solicitud', 'Limpiar formulario']))
    expect(nombres().filter((n) => /^(Cancelar|Guardar)/.test(n))).toEqual([])
  })
})

describe('«Cancelar» solo anula', () => {
  it('en los textos, «Cancelar…» es solo anular una reserva o detener la espera del login', () => {
    const conCancelar = Object.entries(TEXTOS)
      .filter(([, valor]) => /^Cancelar/.test(valor))
      .map(([clave]) => clave)
    expect(conCancelar.sort()).toEqual(['cancelar', 'cancelarReserva', 'cancelarSolicitud'])
  })

  it('ningún texto de la interfaz empieza con «Guardar»', () => {
    expect(Object.values(TEXTOS).filter((valor) => /^Guardar/.test(valor))).toEqual([])
  })
})
