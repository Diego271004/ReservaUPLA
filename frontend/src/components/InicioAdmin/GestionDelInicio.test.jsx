import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderEnRuta, SESIONES } from '../../test/utils.jsx'
import AccesosRapidos from './AccesosRapidos.jsx'
import ActividadReciente from './ActividadReciente.jsx'

const AHORA = new Date('2026-11-10T16:00:00Z')

const evento = (extra = {}) => ({
  reservaId: 7,
  ambienteNombre: 'Auditorio Principal',
  solicitanteNombre: 'Ana Torres',
  fechaReserva: '2026-11-12',
  horaInicio: '10:00',
  horaFin: '12:00',
  estadoAnterior: 'Pendiente',
  estadoNuevo: 'Aprobada',
  usuarioNombre: 'Carla Rojas',
  fecha: '2026-11-10T14:00:00Z',
  ...extra,
})

const mostrar = (elemento) =>
  renderEnRuta(elemento, { ruta: '/dashboard', sesionInicial: SESIONES.administrador })

describe('AccesosRapidos: los cuatro atajos del Administrador', () => {
  it('es una navegación con nombre y cuatro enlaces a sus pantallas', () => {
    mostrar(<AccesosRapidos />)
    const nav = screen.getByRole('navigation', { name: 'Accesos rápidos' })
    const enlaces = within(nav).getAllByRole('link')
    expect(enlaces.map((e) => e.textContent)).toEqual([
      'Nueva reserva',
      'Ver disponibilidad',
      'Nuevo ambiente',
      'Nuevo usuario',
    ])
    expect(enlaces.map((e) => e.getAttribute('href'))).toEqual([
      '/reservas/nueva',
      '/disponibilidad',
      '/ambientes/nuevo',
      '/usuarios/nuevo',
    ])
  })
})

describe('ActividadReciente: trazabilidad de los cambios de estado', () => {
  it('cada fila dice quién hizo qué, sobre qué reserva y cuándo, y lleva al detalle', () => {
    mostrar(<ActividadReciente actividad={[evento()]} ahora={AHORA} />)
    expect(screen.getByRole('heading', { name: 'Actividad reciente' })).toBeInTheDocument()
    const enlace = screen.getByRole('link', { name: /Carla Rojas aprobó la reserva de Ana Torres/ })
    expect(enlace).toHaveAttribute('href', '/reservas/7')
    expect(enlace).toHaveTextContent('Auditorio Principal · 12/11/2026 · 10:00–12:00')
    expect(enlace).toHaveTextContent('hace 2 horas')
    expect(enlace.querySelector('time')).toHaveAttribute('datetime', '2026-11-10T14:00:00Z')
  })

  it('el icono es decorativo: el estado lo dice la frase, no solo el color', () => {
    const { container } = mostrar(<ActividadReciente actividad={[evento()]} ahora={AHORA} />)
    expect(container.querySelector('li svg').closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('las filas van en el orden recibido (lo más nuevo primero)', () => {
    mostrar(
      <ActividadReciente
        actividad={[
          evento({ reservaId: 1, estadoNuevo: 'Rechazada' }),
          evento({ reservaId: 2, estadoNuevo: 'Cancelada', usuarioNombre: 'Ana Torres' }),
          evento({
            reservaId: 3,
            estadoAnterior: null,
            estadoNuevo: 'Pendiente',
            usuarioNombre: 'Ana Torres',
          }),
        ]}
        ahora={AHORA}
      />,
    )
    const filas = screen.getAllByRole('listitem')
    expect(filas).toHaveLength(3)
    expect(filas[0]).toHaveTextContent('Carla Rojas rechazó la solicitud de Ana Torres')
    expect(filas[1]).toHaveTextContent('Ana Torres canceló su reserva')
    expect(filas[2]).toHaveTextContent('Ana Torres registró una solicitud')
  })

  it('sin actividad dice que todavía no hay, en vez de una lista vacía', () => {
    mostrar(<ActividadReciente actividad={[]} ahora={AHORA} />)
    expect(screen.getByText('Todavía no hay actividad reciente.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
