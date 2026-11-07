import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RESULTADO } from '../services/llamarApi.js'
import { obtenerDisponibilidadDia } from '../services/recursosService.js'
import { SESIONES, renderEnRuta } from '../test/utils.jsx'
import DisponibilidadPage from './DisponibilidadPage.jsx'
import { asignarCarrilesReservas, claseDuracionLibre } from '../utils/disponibilidad.js'

vi.mock('../services/recursosService.js', () => ({
  obtenerDisponibilidadDia: vi.fn(),
}))

const exito = (ambientes, extra = {}) => ({
  tipo: RESULTADO.exito,
  data: { fecha: '2026-11-05', soloLectura: false, ambientes, ...extra },
})

beforeEach(() => {
  vi.resetAllMocks()
  obtenerDisponibilidadDia.mockResolvedValue(exito([]))
})
afterEach(cleanup)

describe('Disponibilidad', () => {
  it('asigna carriles a tres reservas solapadas y conserva la base sin solapamientos', () => {
    const tres = asignarCarrilesReservas([
      { id: 1, horaInicio: '10:00', horaFin: '12:00' },
      { id: 2, horaInicio: '11:00', horaFin: '13:00' },
      { id: 3, horaInicio: '12:30', horaFin: '14:00' },
    ])
    expect(tres.map((bloque) => bloque.carril)).toEqual([0, 1, 0])

    const separado = asignarCarrilesReservas([
      { id: 1, horaInicio: '10:00', horaFin: '12:00' },
      { id: 2, horaInicio: '12:00', horaFin: '13:00' },
    ])
    expect(separado.map((bloque) => bloque.carril)).toEqual([0, 0])
  })

  it('clasifica tramos libres de 30 minutos, 1 hora y 3 horas sin texto cortado', () => {
    expect(claseDuracionLibre('07:00', '07:30')).toBe('muy-corto')
    expect(claseDuracionLibre('07:00', '08:00')).toBe('corto')
    expect(claseDuracionLibre('07:00', '10:00')).toBe('medio')
  })
  it('fusión y privacidad: una reserva ajena muestra solo estado y horario en el Solicitante', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(
      exito([
        {
          id: 1,
          nombre: 'Laboratorio Secreto',
          estado: 'Disponible',
          bloques: [
            {
              id: 9,
              horaInicio: '10:00',
              horaFin: '13:00',
              estado: 'Pendiente',
              solicitanteNombre: 'Persona Ajena',
              motivo: 'Motivo confidencial',
            },
          ],
        },
      ]),
    )

    renderEnRuta(<DisponibilidadPage />, {
      ruta: '/disponibilidad',
      sesionInicial: SESIONES.solicitante,
    })

    const rango = await screen.findByRole('button', { name: /10:00.*13:00.*Pendiente/i })
    expect(rango).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('Persona Ajena')
    expect(document.body.textContent).not.toContain('Motivo confidencial')
    expect(screen.queryAllByRole('gridcell')).toHaveLength(0)
  })
  it('esqueleto de carga: muestra el esqueleto durante la carga, distinto del estado vacío', async () => {
    obtenerDisponibilidadDia.mockReturnValue(new Promise(() => {}))
    renderEnRuta(<DisponibilidadPage />)
    expect(screen.getByRole('region', { name: 'Cargando disponibilidad' })).toBeInTheDocument()
    expect(screen.getByText('Cargando disponibilidad…')).toBeInTheDocument()
    expect(
      screen.queryByText(/Día libre en todos los ambientes: puedes reservar el que necesites/i),
    ).not.toBeInTheDocument()
  })

  it('estado vacío: terminado de cargar sin reservas muestra el aviso de día libre y no el esqueleto', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(exito([]))
    renderEnRuta(<DisponibilidadPage />)
    expect(
      await screen.findByRole('heading', {
        name: 'Día libre en todos los ambientes: puedes reservar el que necesites',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Cargando disponibilidad' }),
    ).not.toBeInTheDocument()
  })

  it('muestra día sin reservas con tramos libres y prerrellena Nueva reserva al usar Enter', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(
      exito([{ id: 1, nombre: 'Laboratorio de Cómputo 2', estado: 'Disponible', bloques: [] }]),
    )
    renderEnRuta(<DisponibilidadPage />, { ruta: '/disponibilidad' })
    await screen.findByText('Laboratorio de Cómputo 2')
    const libre = await screen.findByRole('button', {
      name: /Laboratorio de Cómputo 2: libre, 07:00/i,
    })
    libre.focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() =>
      expect(screen.getByTestId('ubicacion')).toHaveTextContent('/reservas/nueva'),
    )
    expect(screen.getByTestId('ubicacion').textContent).toContain('ambienteId=1')
  })

  it('renderiza bloque Aprobada y bloque Pendiente con hora y texto accesible', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(
      exito([
        {
          id: 1,
          nombre: 'Auditorio Principal',
          estado: 'Disponible',
          bloques: [
            {
              id: 1,
              horaInicio: '10:00',
              horaFin: '12:00',
              estado: 'Aprobada',
              solicitanteNombre: 'Ana Torres',
              motivo: null,
            },
            {
              id: 2,
              horaInicio: '12:00',
              horaFin: '13:00',
              estado: 'Pendiente',
              solicitanteNombre: null,
              motivo: null,
            },
          ],
        },
      ]),
    )
    renderEnRuta(<DisponibilidadPage />)
    await screen.findByText('Auditorio Principal')
    expect(screen.getAllByText('Aprobada').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0)
  })

  it('marca mantenimiento sin acción libre', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(
      exito([{ id: 3, nombre: 'Sala de Reuniones A', estado: 'En mantenimiento', bloques: [] }]),
    )
    renderEnRuta(<DisponibilidadPage />)
    await screen.findByText('Sala de Reuniones A')
    expect(screen.getAllByText(/Mantenimiento/i).length).toBeGreaterThan(0)
  })

  it('día pasado deshabilita los tramos libres', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(
      exito([{ id: 1, nombre: 'Laboratorio de Cómputo 2', estado: 'Disponible', bloques: [] }], {
        soloLectura: true,
      }),
    )
    renderEnRuta(<DisponibilidadPage />)
    await screen.findByText('Laboratorio de Cómputo 2')
    expect(
      screen.getAllByRole('button', { name: /libre/i }).every((control) => control.disabled),
    ).toBe(true)
  })

  it('permite mover el foco con las flechas entre tramos', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(
      exito([
        {
          id: 1,
          nombre: 'Laboratorio de Cómputo 2',
          estado: 'Disponible',
          bloques: [
            {
              id: 1,
              horaInicio: '10:00',
              horaFin: '12:00',
              estado: 'Pendiente',
              solicitanteNombre: null,
              motivo: null,
            },
          ],
        },
      ]),
    )
    renderEnRuta(<DisponibilidadPage />)
    const primerLibre = await screen.findByRole('button', { name: /07:00/i })
    primerLibre.focus()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(document.activeElement).not.toBe(primerLibre))
  })

  it('muestra error de carga', async () => {
    obtenerDisponibilidadDia.mockResolvedValue({ tipo: RESULTADO.errorServidor })
    renderEnRuta(<DisponibilidadPage />)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('navega al día anterior, siguiente y vuelve a hoy', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(exito([]))
    renderEnRuta(<DisponibilidadPage />)
    const botonAnterior = screen.getByRole('button', { name: 'Día anterior' })
    const botonSiguiente = screen.getByRole('button', { name: 'Día siguiente' })
    const botonHoy = screen.getByRole('button', { name: 'Hoy' })
    await userEvent.click(botonAnterior)
    await userEvent.click(botonSiguiente)
    await userEvent.click(botonHoy)
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument()
  })

  it('inicializa la fecha desde el parámetro ?fecha= de la URL', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(exito([]))
    renderEnRuta(<DisponibilidadPage />, { ruta: '/disponibilidad?fecha=2026-11-05' })
    await waitFor(() => expect(screen.getByLabelText('Fecha')).toHaveValue('05/11/2026'))
  })

  it('horas pasadas con tiempo inyectado (07:00, 12:00, 21:00) y tramo libre habilitado', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(
      exito([{ id: 1, nombre: 'Laboratorio de Cómputo 2', estado: 'Disponible', bloques: [] }]),
    )
    const d07 = new Date()
    d07.setHours(7, 0, 0, 0)
    const { unmount: u1 } = renderEnRuta(<DisponibilidadPage ahora={d07} />, {
      ruta: '/disponibilidad',
    })
    await screen.findByText('Laboratorio de Cómputo 2')
    expect(screen.queryByRole('region', { name: 'Horas pasadas' })).toBeNull()
    u1()

    const d12 = new Date()
    d12.setHours(12, 0, 0, 0)
    const { unmount: u2 } = renderEnRuta(<DisponibilidadPage ahora={d12} />, {
      ruta: '/disponibilidad',
    })
    await screen.findByText('Laboratorio de Cómputo 2')
    expect(screen.getByRole('region', { name: 'Horas pasadas' })).toBeInTheDocument()
    u2()

    const d21 = new Date()
    d21.setHours(21, 0, 0, 0)
    renderEnRuta(<DisponibilidadPage ahora={d21} />, { ruta: '/disponibilidad' })
    await screen.findByText('Laboratorio de Cómputo 2')
    expect(screen.getByRole('region', { name: 'Horas pasadas' })).toBeInTheDocument()
  })

  it('los nombres de ambientes incluyen título accesible y tramos libres tienen borde punteado e icono', async () => {
    obtenerDisponibilidadDia.mockResolvedValue(
      exito([
        {
          id: 1,
          nombre: 'Laboratorio de Cómputo 2',
          estado: 'Disponible',
          bloques: [
            {
              id: 10,
              horaInicio: '08:00',
              horaFin: '22:00',
              estado: 'Aprobada',
            },
          ],
        },
      ]),
    )
    renderEnRuta(<DisponibilidadPage />, { ruta: '/disponibilidad' })
    const nombre = await screen.findByText('Laboratorio de Cómputo 2')
    expect(nombre).toHaveAttribute('title', 'Laboratorio de Cómputo 2')
    expect(nombre).toHaveAttribute('aria-label', 'Laboratorio de Cómputo 2')

    // Tramo de 07:00 a 08:00 (60 min <= 90 min): texto visible es "Libre", pero title y aria-label contienen horas
    const libre = screen.getByRole('button', {
      name: /Laboratorio de Cómputo 2: libre, 07:00 a 08:00/i,
    })
    expect(libre.className).toMatch(/libre/)
    expect(libre.textContent).toContain('Libre')
    expect(libre.textContent).not.toContain('07:00–08:00')
    expect(libre.querySelector('svg')).toBeInTheDocument()

    // Leyenda completa incluye los 5 estados explicados
    const leyenda = screen.getByRole('generic', { name: 'Leyenda' })
    expect(leyenda).toBeInTheDocument()
    expect(leyenda.textContent).toContain('Libre')
    expect(leyenda.textContent).toContain('Pendiente')
    expect(leyenda.textContent).toContain('Aprobada')
    expect(leyenda.textContent).toContain('Mantenimiento')
    expect(leyenda.textContent).toContain('Horas pasadas')
  })
})
