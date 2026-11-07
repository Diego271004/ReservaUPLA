import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext.jsx'
import { usePendientes } from '../../context/PendientesContext.jsx'
import { RESULTADO } from '../../services/llamarApi.js'
import { obtenerDashboard } from '../../services/recursosService.js'
import { SESIONES, UbicacionActual, iniciarSesionEnPrueba } from '../../test/utils.jsx'
import { CLAVE_MENU_COLAPSADO } from '../../hooks/useMenuColapsado.js'
import Layout from './Layout.jsx'

vi.mock('../../services/recursosService.js', () => ({ obtenerDashboard: vi.fn() }))

const panel = (pendientes) => ({ tipo: RESULTADO.exito, data: { indicadores: { pendientes } } })

function Refrescador() {
  const { refrescar } = usePendientes()
  return <button onClick={refrescar}>Decidir una solicitud</button>
}

function montar(sesion, ruta = '/reservas', state = null) {
  sessionStorage.clear()
  iniciarSesionEnPrueba(sesion)
  return render(
    <MemoryRouter initialEntries={[{ pathname: ruta, state }]}>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="*" element={<Refrescador />} />
          </Route>
          <Route path="/login" element={<p>pantalla de login</p>} />
        </Routes>
        <UbicacionActual />
      </AuthProvider>
    </MemoryRouter>,
  )
}
const menu = () => screen.getByRole('navigation', { name: 'Principal' })

beforeEach(() => {
  vi.resetAllMocks()
  obtenerDashboard.mockResolvedValue(panel(0))
  localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

describe('Menú lateral: icono y texto en cada opción', () => {
  it.each([
    [
      'administrador',
      ['Inicio', 'Disponibilidad', 'Reservas', 'Nueva reserva', 'Ambientes', 'Usuarios'],
    ],
    ['solicitante', ['Inicio', 'Disponibilidad', 'Reservas', 'Nueva reserva']],
    ['responsable', ['Inicio', 'Disponibilidad', 'Mi ambiente']],
  ])('%s: cada enlace lleva un icono decorativo y su texto', (rol, textos) => {
    montar(SESIONES[rol])
    const enlaces = within(menu()).getAllByRole('link')
    expect(enlaces.map((e) => e.textContent.replace(/\d+ pendientes?/, '').trim())).toEqual(textos)
    for (const enlace of enlaces) {
      const icono = enlace.querySelector('svg')
      expect(icono).not.toBeNull()
      expect(icono).toHaveAttribute('aria-hidden', 'true')
    }
  })
})

describe('Menú lateral colapsable (escritorio)', () => {
  it('«Contraer menú» deja solo los iconos, conserva los nombres accesibles y guarda la preferencia', async () => {
    montar(SESIONES.administrador)
    const aside = screen.getByRole('complementary')
    expect(aside).toHaveAttribute('data-colapsado', 'false')
    await userEvent.click(screen.getByRole('button', { name: 'Contraer menú' }))
    expect(aside).toHaveAttribute('data-colapsado', 'true')
    expect(localStorage.getItem(CLAVE_MENU_COLAPSADO)).toBe('1')
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Expandir menú' }))
    expect(aside).toHaveAttribute('data-colapsado', 'false')
    expect(localStorage.getItem(CLAVE_MENU_COLAPSADO)).toBe('0')
  })

  it('la próxima visita arranca con la preferencia guardada', () => {
    localStorage.setItem(CLAVE_MENU_COLAPSADO, '1')
    montar(SESIONES.administrador)
    expect(screen.getByRole('complementary')).toHaveAttribute('data-colapsado', 'true')
    expect(screen.getByRole('button', { name: 'Expandir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})

describe('Barra superior: migas, fecha de hoy y saludo de la sesión', () => {
  it('muestra la fecha de hoy en Lima como dd/mm/aaaa', () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-05T03:00:00Z') }) // aún es 04/11 en Lima
    montar(SESIONES.administrador)
    const fecha = screen.getByText('04/11/2026')
    expect(fecha.tagName).toBe('TIME')
    expect(fecha).toHaveAttribute('dateTime', '2026-11-04')
  })

  it('en una sección raíz de nivel 1 la barra superior queda limpia sin título ni migas de pan', () => {
    montar(SESIONES.administrador, '/ambientes')
    expect(screen.queryByRole('navigation', { name: 'Migas de pan' })).toBeNull()
    expect(screen.queryByText('Administración', { selector: 'header span' })).toBeNull()
  })

  it('en Inicio (/dashboard) la barra superior queda limpia a la izquierda sin título ni migas', () => {
    montar(SESIONES.administrador, '/dashboard')
    expect(screen.queryByRole('navigation', { name: 'Migas de pan' })).toBeNull()
    expect(screen.queryByText('Reservas', { selector: 'header span' })).toBeNull()
  })

  it('en nueva reserva muestra la miga completa hacia Reservas y el enlace móvil de regreso', () => {
    montar(SESIONES.solicitante, '/reservas/nueva')
    const migas = screen.getByRole('navigation', { name: 'Migas de pan' })
    expect(within(migas).getByRole('link', { name: 'Reservas' })).toHaveAttribute(
      'href',
      '/reservas',
    )
    expect(within(migas).getByRole('link', { name: '‹ Reservas' })).toHaveAttribute(
      'href',
      '/reservas',
    )
    expect(within(migas).getByText('Nueva reserva')).toHaveAttribute('aria-current', 'page')
  })

  it('en el detalle la miga del origen es un enlace de regreso', () => {
    montar(SESIONES.administrador, '/reservas/7', { volverA: '/dashboard' })
    const migas = screen.getByRole('navigation', { name: 'Migas de pan' })
    expect(within(migas).getByRole('link', { name: 'Inicio' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
    expect(within(migas).getByText('Detalle de la reserva')).toHaveAttribute('aria-current', 'page')
  })
})

describe('Menú de usuario', () => {
  it('muestra el nombre y el rol en el disparador, con las iniciales como avatar', () => {
    montar(SESIONES.responsable, '/mi-ambiente')
    const disparador = screen.getByRole('button', { name: /Mario Huamán/ })
    expect(disparador).toHaveAttribute('aria-expanded', 'false')
    expect(within(disparador).getByText('Responsable de ambiente')).toBeInTheDocument()
    expect(within(disparador).getByText('MH')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull()
  })

  it('al abrirlo ofrece Cerrar sesión, que borra la sesión y lleva al login', async () => {
    montar(SESIONES.administrador)
    await userEvent.click(screen.getByRole('button', { name: /Carla Rojas/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(screen.getByText('pantalla de login')).toBeInTheDocument()
    expect(sessionStorage.length).toBe(0)
  })

  it('Escape lo cierra y devuelve el foco al disparador', async () => {
    montar(SESIONES.administrador)
    const disparador = screen.getByRole('button', { name: /Carla Rojas/ })
    await userEvent.click(disparador)
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull()
    expect(disparador).toHaveFocus()
  })

  it('un clic fuera lo cierra', async () => {
    montar(SESIONES.administrador)
    await userEvent.click(screen.getByRole('button', { name: /Carla Rojas/ }))
    await userEvent.click(document.body)
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull()
  })

  it('al salir con Tab del menú abierto, se cierra', async () => {
    montar(SESIONES.administrador)
    await userEvent.click(screen.getByRole('button', { name: /Carla Rojas/ }))
    await userEvent.tab() // Cerrar sesión
    await userEvent.tab() // fuera del menú
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull()
  })
})

describe('Menú de usuario: solo con teclado', () => {
  const disparador = () => screen.getByRole('button', { name: /Carla Rojas/ })

  it.each([
    ['Enter', '{Enter}'],
    ['Espacio', ' '],
  ])('%s lo abre', async (_nombre, tecla) => {
    montar(SESIONES.administrador)
    disparador().focus()
    await userEvent.keyboard(tecla)
    expect(disparador()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })

  it('Escape lo cierra y el foco vuelve al botón que lo abrió', async () => {
    montar(SESIONES.administrador)
    disparador().focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.tab() // al botón «Cerrar sesión»
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull()
    expect(disparador()).toHaveFocus()
    expect(disparador()).toHaveAttribute('aria-expanded', 'false')
  })

  it('Tab recorre su opción dentro del panel; al salir con Tab el panel se cierra (documentado)', async () => {
    montar(SESIONES.administrador)
    disparador().focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull()
    expect(disparador()).toHaveAttribute('aria-expanded', 'false')
  })

  it('«Cerrar sesión» tiene un nombre accesible claro (texto, no solo el icono)', async () => {
    montar(SESIONES.administrador)
    disparador().focus()
    await userEvent.keyboard('{Enter}')
    const boton = screen.getByRole('button', { name: 'Cerrar sesión' })
    expect(boton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('el disparador tiene nombre accesible con la persona y su rol, también cuando el nombre se oculta en móvil', () => {
    montar(SESIONES.administrador)
    expect(screen.getByRole('button', { name: 'Carla Rojas, Administrador' })).toBeInTheDocument()
  })
})

describe('Menú móvil: panel deslizante con foco atrapado', () => {
  const hamburguesa = () => screen.getByRole('button', { name: 'Menú' })

  it('la hamburguesa abre el panel y anuncia su estado', async () => {
    montar(SESIONES.administrador)
    expect(hamburguesa()).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(hamburguesa())
    expect(hamburguesa()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('complementary')).toHaveAttribute('data-abierto', 'true')
  })

  it('al abrir, el foco pasa al panel; Escape lo cierra y el foco vuelve a la hamburguesa', async () => {
    montar(SESIONES.administrador)
    await userEvent.click(hamburguesa())
    expect(screen.getByRole('complementary').contains(document.activeElement)).toBe(true)
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('complementary')).toHaveAttribute('data-abierto', 'false')
    expect(hamburguesa()).toHaveFocus()
  })

  it('Escape lo cierra aunque el foco siga fuera del panel (defecto hallado en el navegador: el panel aún era invisible al abrir)', async () => {
    montar(SESIONES.administrador)
    await userEvent.click(hamburguesa())
    hamburguesa().focus() // el foco no logró entrar al panel
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('complementary')).toHaveAttribute('data-abierto', 'false')
  })

  it('un clic fuera (en el fondo) lo cierra', async () => {
    montar(SESIONES.administrador)
    await userEvent.click(hamburguesa())
    await userEvent.click(screen.getByTestId('fondo-del-menu'))
    expect(screen.getByRole('complementary')).toHaveAttribute('data-abierto', 'false')
  })

  it('«Cerrar menú» dentro del panel también lo cierra', async () => {
    montar(SESIONES.administrador)
    await userEvent.click(hamburguesa())
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }))
    expect(screen.getByRole('complementary')).toHaveAttribute('data-abierto', 'false')
  })

  it('el foco queda atrapado: Tab desde el último elemento vuelve al primero y Mayús+Tab al revés', async () => {
    montar(SESIONES.solicitante)
    await userEvent.click(hamburguesa())
    const aside = screen.getByRole('complementary')
    const focalizables = [...aside.querySelectorAll('a, button')]
    focalizables.at(-1).focus()
    await userEvent.tab()
    expect(focalizables[0]).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(focalizables.at(-1)).toHaveFocus()
  })

  it('elegir una opción cierra el panel', async () => {
    montar(SESIONES.solicitante)
    await userEvent.click(hamburguesa())
    await userEvent.click(within(menu()).getByRole('link', { name: 'Nueva reserva' }))
    expect(screen.getByRole('complementary')).toHaveAttribute('data-abierto', 'false')
  })
})

describe('Contador de pendientes junto a «Reservas» (Administrador)', () => {
  it('muestra «6 pendientes» como texto accesible', async () => {
    obtenerDashboard.mockResolvedValue(panel(6))
    montar(SESIONES.administrador)
    const enlace = await screen.findByRole('link', { name: /Reservas.*6 pendientes/ })
    expect(within(enlace).getByText('6 pendientes')).toBeInTheDocument()
  })

  it('en singular dice «1 pendiente»', async () => {
    obtenerDashboard.mockResolvedValue(panel(1))
    montar(SESIONES.administrador)
    expect(await screen.findByRole('link', { name: /Reservas.*1 pendiente$/ })).toBeInTheDocument()
  })

  it('con cero pendientes no hay contador', async () => {
    montar(SESIONES.administrador)
    await act(async () => {})
    expect(screen.getByRole('link', { name: 'Reservas' })).toBeInTheDocument()
  })

  it('se actualiza tras decidir una solicitud', async () => {
    obtenerDashboard.mockResolvedValueOnce(panel(6)).mockResolvedValueOnce(panel(5))
    montar(SESIONES.administrador)
    await screen.findByRole('link', { name: /6 pendientes/ })
    await userEvent.click(screen.getByRole('button', { name: 'Decidir una solicitud' }))
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Reservas.*5 pendientes/ })).toBeInTheDocument(),
    )
  })

  it('la Solicitante y la Responsable no consultan ni ven el contador', async () => {
    montar(SESIONES.solicitante)
    await act(async () => {})
    expect(obtenerDashboard).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Reservas' })).toBeInTheDocument()
  })
})
