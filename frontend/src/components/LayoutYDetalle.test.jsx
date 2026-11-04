import { describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import { SESIONES, UbicacionActual, iniciarSesionEnPrueba } from '../test/utils.jsx'
import AlertMessage from './ui/AlertMessage.jsx'
import Button from './ui/Button.jsx'
import DetalleReserva from './DetalleReserva/DetalleReserva.jsx'
import Layout from './Layout/Layout.jsx'

function mostrarLayout(sesion, ruta = '/reservas') {
  sessionStorage.clear()
  iniciarSesionEnPrueba(sesion)
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="*" element={<p>contenido</p>} />
          </Route>
          <Route path="/login" element={<p>pantalla de login</p>} />
        </Routes>
        <UbicacionActual />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const opcionesDelMenu = () =>
  within(screen.getByRole('navigation', { name: 'Principal' }))
    .getAllByRole('link')
    .map((enlace) => enlace.textContent)

const marcadas = () =>
  within(screen.getByRole('navigation', { name: 'Principal' }))
    .getAllByRole('link')
    .filter((enlace) => enlace.hasAttribute('aria-current'))
    .map((enlace) => enlace.textContent)

describe('Layout: en el detalle de una reserva el menú marca la sección de origen', () => {
  const detalle = (volverA) => ({ pathname: '/reservas/7', state: volverA ? { volverA } : null })

  it('por defecto marca Reservas', () => {
    mostrarLayout(SESIONES.administrador, detalle())
    expect(marcadas()).toEqual(['Reservas'])
  })

  it('si se vino del Dashboard marca Dashboard', () => {
    mostrarLayout(SESIONES.administrador, detalle('/dashboard'))
    expect(marcadas()).toEqual(['Dashboard'])
  })

  it('si se vino de una lista filtrada marca Reservas', () => {
    mostrarLayout(SESIONES.solicitante, detalle('/reservas?estado=Pendiente&pagina=2'))
    expect(marcadas()).toEqual(['Reservas'])
  })

  it('la Responsable ve marcada Mi ambiente, con o sin origen', () => {
    mostrarLayout(SESIONES.responsable, detalle())
    expect(marcadas()).toEqual(['Mi ambiente'])
    cleanup()
    mostrarLayout(SESIONES.responsable, detalle('/mi-ambiente?ambienteId=3'))
    expect(marcadas()).toEqual(['Mi ambiente'])
  })

  it('«Nueva reserva» sigue marcando solo su opción', () => {
    mostrarLayout(SESIONES.solicitante, '/reservas/nueva')
    expect(marcadas()).toEqual(['Nueva reserva'])
  })
})

describe('Layout: menú por rol (hallazgo G1: un solo layout)', () => {
  it('el Administrador ve las cinco opciones', () => {
    mostrarLayout(SESIONES.administrador)
    expect(opcionesDelMenu()).toEqual([
      'Dashboard',
      'Reservas',
      'Nueva reserva',
      'Ambientes',
      'Usuarios',
    ])
  })

  it('la Solicitante ve solo Reservas y Nueva reserva', () => {
    mostrarLayout(SESIONES.solicitante)
    expect(opcionesDelMenu()).toEqual(['Reservas', 'Nueva reserva'])
  })

  it('la Responsable ve solo Mi ambiente', () => {
    mostrarLayout(SESIONES.responsable, '/mi-ambiente')
    expect(opcionesDelMenu()).toEqual(['Mi ambiente'])
  })

  it('muestra el nombre y el rol de la persona (Responsable de ambiente)', () => {
    mostrarLayout(SESIONES.responsable, '/mi-ambiente')
    expect(screen.getByText('Mario Huamán')).toBeInTheDocument()
    expect(screen.getByText('Responsable de ambiente')).toBeInTheDocument()
  })

  it('resalta solo la opción de la página actual', () => {
    mostrarLayout(SESIONES.administrador, '/reservas/nueva')
    expect(screen.getByRole('link', { name: 'Nueva reserva' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Reservas' })).not.toHaveAttribute('aria-current')
  })

  it('Ambientes sigue activo en una subpágina (/ambientes/nuevo)', () => {
    mostrarLayout(SESIONES.administrador, '/ambientes/nuevo')
    expect(screen.getByRole('link', { name: 'Ambientes' })).toHaveAttribute('aria-current', 'page')
  })

  it('Cerrar sesión borra la sesión y lleva al login', async () => {
    mostrarLayout(SESIONES.administrador)
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(sessionStorage.length).toBe(0)
    expect(screen.getByText('pantalla de login')).toBeInTheDocument()
  })

  it('el botón Menú abre y cierra el menú en móvil (aria-expanded)', async () => {
    mostrarLayout(SESIONES.solicitante)
    const boton = screen.getByRole('button', { name: 'Menú' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'false')
  })

  it('se navega solo con el teclado: Tab hasta una opción y Enter', async () => {
    mostrarLayout(SESIONES.solicitante, '/reservas')
    await userEvent.tab() // botón Menú
    await userEvent.tab() // Reservas
    await userEvent.tab() // Nueva reserva
    expect(screen.getByRole('link', { name: 'Nueva reserva' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/reservas/nueva')
  })
})

describe('DetalleReserva (hallazgo E4: un único componente)', () => {
  const reserva = {
    ambienteNombre: 'Laboratorio de Cómputo 2',
    solicitanteNombre: 'Ana Torres',
    fecha: '2026-11-05',
    horaInicio: '10:00',
    horaFin: '12:00',
    motivo: 'Práctica de programación',
    estado: 'Pendiente',
  }
  const mostrar = (props) =>
    render(
      <MemoryRouter>
        <DetalleReserva reserva={reserva} {...props} />
      </MemoryRouter>,
    )

  it('el enlace de regreso se llama como su destino: «Volver al Dashboard» si se vino del Dashboard', () => {
    mostrar({ volverA: '/dashboard' })
    expect(screen.getByRole('link', { name: 'Volver al Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
    expect(screen.queryByRole('link', { name: 'Volver a Reservas' })).not.toBeInTheDocument()
  })

  it('«Volver a Reservas» conserva los filtros y la página de la lista de donde se vino', () => {
    mostrar({ volverA: '/reservas?estado=Pendiente&pagina=2' })
    expect(screen.getByRole('link', { name: 'Volver a Reservas' })).toHaveAttribute(
      'href',
      '/reservas?estado=Pendiente&pagina=2',
    )
  })

  it('muestra enlace de regreso con flecha, datos, estado con icono e historial vacío', () => {
    const { container } = mostrar()
    expect(screen.getByRole('link', { name: 'Volver a Reservas' })).toHaveAttribute(
      'href',
      '/reservas',
    )
    expect(screen.getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(screen.getByText('05/11/2026')).toBeInTheDocument()
    expect(screen.getByText('10:00 – 12:00')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Todavía no hay eventos.')).toBeInTheDocument()
    expect(container.querySelectorAll('a svg')).toHaveLength(1)
  })

  it('la estructura es la misma para otro estado; solo cambian alerta y acciones', () => {
    const { container: pendiente } = mostrar()
    const estructura = (contenedor) =>
      [...contenedor.querySelectorAll('dt')].map((dt) => dt.textContent)
    const antes = estructura(pendiente)

    const { container: rechazada } = render(
      <MemoryRouter>
        <DetalleReserva
          reserva={{ ...reserva, estado: 'Rechazada' }}
          alerta={
            <AlertMessage tipo="info">Una reserva rechazada no se puede modificar.</AlertMessage>
          }
          acciones={<Button deshabilitado>Aprobar</Button>}
        />
      </MemoryRouter>,
    )
    expect(estructura(rechazada)).toEqual(antes)
    expect(screen.getByText('Una reserva rechazada no se puede modificar.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeDisabled()
  })

  it('muestra el historial cuando lo recibe', () => {
    mostrar({ historial: [{ id: 1, texto: 'Solicitud registrada por Ana Torres' }] })
    expect(screen.getByText('Solicitud registrada por Ana Torres')).toBeInTheDocument()
  })
})
