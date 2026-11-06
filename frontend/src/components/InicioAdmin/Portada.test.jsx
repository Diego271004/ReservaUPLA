import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderEnRuta, SESIONES } from '../../test/utils.jsx'
import CardIndicador from '../ui/CardIndicador.jsx'
import Portada from './Portada.jsx'
import AgendaDeHoy from './AgendaDeHoy.jsx'

const AHORA = new Date('2026-11-05T15:00:00-05:00')
const mostrar = (pendientes) =>
  renderEnRuta(<Portada pendientes={pendientes} ahora={AHORA} />, {
    ruta: '/dashboard',
    sesionInicial: SESIONES.administrador,
  })

describe('Portada del Inicio del Administrador', () => {
  it('con varias pendientes dice cuántas esperan decisión, la fecha en letras y lleva a revisarlas', () => {
    mostrar(2)
    expect(
      screen.getByRole('heading', { level: 2, name: '2 solicitudes esperan tu decisión' }),
    ).toBeInTheDocument()
    expect(screen.getByText('jueves, 5 de noviembre de 2026')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Revisar solicitudes' })).toHaveAttribute(
      'href',
      '/reservas?estado=Pendiente',
    )
  })

  it('con una sola pendiente el texto va en singular', () => {
    mostrar(1)
    expect(
      screen.getByRole('heading', { name: '1 solicitud espera tu decisión' }),
    ).toBeInTheDocument()
  })

  it('sin pendientes dice «Todo al día» y ofrece ver la disponibilidad', () => {
    mostrar(0)
    expect(screen.getByRole('heading', { name: 'Todo al día' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver disponibilidad' })).toHaveAttribute(
      'href',
      '/disponibilidad',
    )
    expect(screen.queryByRole('link', { name: 'Revisar solicitudes' })).not.toBeInTheDocument()
  })

  it('la marca de hexágonos es decorativa: oculta al lector de pantalla y sin foco', () => {
    const { container } = mostrar(2)
    const marca = container.querySelector('svg')
    expect(marca).toHaveAttribute('aria-hidden', 'true')
    expect(marca).toHaveAttribute('focusable', 'false')
  })

  it('es una región con nombre (su título) para quien navega por regiones', () => {
    mostrar(3)
    expect(
      screen.getByRole('region', { name: '3 solicitudes esperan tu decisión' }),
    ).toBeInTheDocument()
  })
})

describe('CardIndicador: icono, tono y tarjeta ancha', () => {
  const mostrarTarjeta = (props) =>
    renderEnRuta(<CardIndicador valor={6} descripcion="Total de reservas" {...props} />, {
      ruta: '/dashboard',
      sesionInicial: SESIONES.administrador,
    })

  it('el icono es decorativo y el número y la descripción siguen siendo el texto', () => {
    const { container } = mostrarTarjeta({ icono: 'reloj', tono: 'aviso' })
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('Total de reservas')).toBeInTheDocument()
  })

  it('sin icono no pinta el recuadro del icono', () => {
    const { container } = mostrarTarjeta({})
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('con enlace es un link con nombre «descripción: valor» y una flecha decorativa', () => {
    const { container } = mostrarTarjeta({ href: '/reservas?estado=Pendiente', icono: 'reloj' })
    expect(screen.getByRole('link', { name: 'Total de reservas: 6' })).toHaveAttribute(
      'href',
      '/reservas?estado=Pendiente',
    )
    expect(container.querySelectorAll('svg')).toHaveLength(2)
  })

  it('sin enlace no es un link ni lleva flecha', () => {
    const { container } = mostrarTarjeta({ icono: 'marca' })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(container.querySelectorAll('svg')).toHaveLength(1)
  })

  it('un valor de texto usa el estilo de texto (más chico que un número)', () => {
    const { container } = mostrarTarjeta({ valor: 'Auditorio Principal' })
    expect(container.querySelector('p').className).toMatch(/valorTexto/)
  })

  it('la tarjeta ancha marca su enlace para ocupar toda la fila', () => {
    const { container } = mostrarTarjeta({ href: '/reservas', ancha: true })
    expect(container.querySelector('a').className).toMatch(/ancha/)
  })

  it('el detalle se muestra bajo la descripción', () => {
    mostrarTarjeta({ detalle: 'Incluye canceladas' })
    expect(screen.getByText('Incluye canceladas')).toBeInTheDocument()
  })
})

describe('AgendaDeHoy: la etiqueta «Ahora» nunca se sale del carril', () => {
  const AMBIENTES = [{ id: 1, nombre: 'Auditorio Principal', estado: 'Disponible', reservas: [] }]

  it.each([7, 14, 21, 22])(
    'a las %s h la etiqueta se coloca con clamp dentro del carril',
    (hora) => {
      const { container } = renderEnRuta(<AgendaDeHoy ambientes={AMBIENTES} horaActual={hora} />, {
        ruta: '/dashboard',
        sesionInicial: SESIONES.administrador,
      })
      const etiqueta = container.querySelector('[aria-label^="Ahora"]')
      expect(etiqueta).toHaveAttribute('aria-label', `Ahora ${String(hora).padStart(2, '0')}:00`)
      // jsdom puede quitar el calc() interior: lo que importa es el piso y el techo de 2,75 rem alrededor del porcentaje.
      expect(etiqueta.style.left).toMatch(
        /^clamp\(2\.75rem, [\d.]+%, (calc\()?100% - 2\.75rem\)?\)$/,
      )
    },
  )

  it('fuera del horario (6 h) no hay etiqueta de hora actual', () => {
    const { container } = renderEnRuta(<AgendaDeHoy ambientes={AMBIENTES} horaActual={6} />, {
      ruta: '/dashboard',
      sesionInicial: SESIONES.administrador,
    })
    expect(container.querySelector('[aria-label^="Ahora"]')).not.toBeInTheDocument()
  })
})
