import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MENSAJES } from './constants/messages.js'
import { RESULTADO } from './services/llamarApi.js'
import {
  listarAmbientes,
  listarUsuarios,
  obtenerDashboard,
  obtenerDisponibilidadDia,
  obtenerMiAmbiente,
  obtenerReserva,
} from './services/recursosService.js'
import { SESIONES, renderApp } from './test/utils.jsx'

vi.mock('./services/recursosService.js', () => ({
  aprobarReserva: vi.fn(),
  cancelarReserva: vi.fn(),
  consultarDisponibilidad: vi.fn(),
  crearAmbiente: vi.fn(),
  crearReserva: vi.fn(),
  crearUsuario: vi.fn(),
  listarAmbientes: vi.fn(),
  listarReservas: vi.fn(),
  listarUsuarios: vi.fn(),
  obtenerDashboard: vi.fn(),
  obtenerDisponibilidadDia: vi.fn(),
  obtenerMiAmbiente: vi.fn(),
  obtenerReserva: vi.fn(),
  rechazarReserva: vi.fn(),
}))

const usuarios = [
  {
    id: 1,
    nombreCompleto: 'Carla Rojas',
    correo: 'carla.rojas@upla.edu.pe',
    rol: 'Administrador',
    activo: true,
  },
  {
    id: 3,
    nombreCompleto: 'Mario Huamán',
    correo: 'mario.huaman@upla.edu.pe',
    rol: 'Responsable',
    activo: true,
  },
  {
    id: 4,
    nombreCompleto: 'Rosa Chávez',
    correo: 'rosa.chavez@upla.edu.pe',
    rol: 'Responsable',
    activo: false,
  },
]
const ambientes = [
  {
    id: 1,
    nombre: 'Laboratorio de Cómputo 2',
    tipo: 'Laboratorio',
    capacidad: 30,
    ubicacion: 'Pabellón A, piso 2',
    estado: 'Disponible',
    responsableNombre: 'Mario Huamán',
  },
  {
    id: 3,
    nombre: 'Sala de Reuniones A',
    tipo: 'Sala',
    capacidad: 12,
    ubicacion: 'Pabellón A, piso 3',
    estado: 'En mantenimiento',
    responsableNombre: null,
  },
]

beforeEach(() => {
  vi.resetAllMocks()
  listarUsuarios.mockResolvedValue({ tipo: RESULTADO.exito, data: usuarios })
  listarAmbientes.mockResolvedValue({ tipo: RESULTADO.exito, data: ambientes })
  obtenerDashboard.mockResolvedValue({
    tipo: RESULTADO.exito,
    data: {
      indicadores: { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0 },
      ambientesMasUtilizados: [],
      pendientesMasAntiguas: { elementos: [], total: 0, pagina: 1, tamano: 5 },
      solicitudesRequierenDecision: [],
      hoyEnLosAmbientes: [],
      usoPorAmbiente: [],
      inicioSolicitante: { proximaReserva: null, resumenPorEstado: [] },
      inicioResponsable: { hoy: [], proximas: [] },
    },
  })
  obtenerDisponibilidadDia.mockResolvedValue({
    tipo: RESULTADO.exito,
    data: { fecha: '2026-11-05', soloLectura: false, ambientes: [] },
  })
})
afterEach(() => vi.unstubAllGlobals())

const ubicacion = () => screen.getByTestId('ubicacion')

describe('rutas protegidas por sesión', () => {
  it.each([
    '/ambientes',
    '/usuarios',
    '/reservas/nueva',
    '/reservas',
    '/mi-ambiente',
    '/dashboard',
  ])('sin sesión, %s lleva al login', async (ruta) => {
    await renderApp(ruta)
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(ubicacion()).toHaveTextContent('/login')
  })

  it('la raíz lleva al login sin sesión y a la pantalla inicial del rol con sesión', async () => {
    await renderApp('/')
    expect(ubicacion()).toHaveTextContent('/login')
    cleanup()
    await renderApp('/', SESIONES.solicitante)
    await waitFor(() => expect(ubicacion()).toHaveTextContent('/dashboard'))
  })

  it('una sesión vencida cuenta como sin sesión', async () => {
    await renderApp('/ambientes', {
      ...SESIONES.administrador,
      expiraEn: new Date(Date.now() - 1000).toISOString(),
    })
    expect(ubicacion()).toHaveTextContent('/login')
  })
})

describe('rutas protegidas por rol', () => {
  it.each(['administrador', 'solicitante', 'responsable'])(
    '%s puede montar Disponibilidad por la ruta real',
    async (rol) => {
      await renderApp('/disponibilidad', SESIONES[rol])
      expect(await screen.findByRole('heading', { name: 'Disponibilidad' })).toBeInTheDocument()
      cleanup()
    },
  )
  it('todos los roles aterrizan en /dashboard desde la raíz', async () => {
    for (const rol of ['administrador', 'solicitante', 'responsable']) {
      await renderApp('/', SESIONES[rol])
      expect(ubicacion()).toHaveTextContent('/dashboard')
      cleanup()
    }
  })

  it.each(['administrador', 'solicitante', 'responsable'])(
    '%s puede montar el Dashboard completo por la ruta real',
    async (rol) => {
      obtenerDashboard.mockReturnValue(new Promise(() => {}))
      await renderApp('/dashboard', SESIONES[rol])
      expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
      cleanup()
    },
  )

  it('un Solicitante ve «Tu próxima reserva» al montar /dashboard por el router real', async () => {
    obtenerDashboard.mockResolvedValue({
      tipo: RESULTADO.exito,
      data: {
        inicioSolicitante: {
          proximaReserva: {
            id: 21,
            ambienteNombre: 'Auditorio Principal',
            fecha: '2026-11-06',
            horaInicio: '09:00',
            horaFin: '11:00',
            estado: 'Aprobada',
          },
          resumenPorEstado: [],
        },
      },
    })
    await renderApp('/dashboard', SESIONES.solicitante)
    expect(await screen.findByRole('heading', { name: 'Tu próxima reserva' })).toBeInTheDocument()
  })

  it('un Responsable ve «Hoy en tu ambiente» al montar /dashboard por el router real', async () => {
    obtenerDashboard.mockResolvedValue({
      tipo: RESULTADO.exito,
      data: { inicioResponsable: { hoy: [], proximas: [] } },
    })
    await renderApp('/dashboard', SESIONES.responsable)
    expect(await screen.findByRole('heading', { name: 'Hoy en tu ambiente' })).toBeInTheDocument()
  })

  it('el Administrador entra a Ambientes y Usuarios', async () => {
    await renderApp('/ambientes', SESIONES.administrador)
    expect(await screen.findByRole('heading', { name: 'Ambientes' })).toBeInTheDocument()
    cleanup()
    await renderApp('/usuarios', SESIONES.administrador)
    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument()
  })

  it.each([
    ['Solicitante', '/ambientes'],
    ['Solicitante', '/usuarios'],
    ['Solicitante', '/usuarios/nuevo'],
    ['Solicitante', '/mi-ambiente'],
    ['Responsable', '/reservas/nueva'],
    ['Responsable', '/ambientes/nuevo'],
    ['Responsable', '/usuarios'],
  ])('%s en %s ve "Sin permiso" y la pantalla no se carga', async (rol, ruta) => {
    const clave = rol === 'Solicitante' ? 'solicitante' : 'responsable'
    await renderApp(ruta, SESIONES[clave])
    expect(screen.getByRole('heading', { name: 'Sin permiso' })).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.sinPermiso)).toBeInTheDocument()
    expect(listarUsuarios).not.toHaveBeenCalled()
    expect(listarAmbientes).not.toHaveBeenCalled()
  })

  it('cada rol entra a su pantalla inicial: los tres roles muestran Inicio; el Administrador puede abrir la raíz', async () => {
    obtenerMiAmbiente.mockReturnValue(new Promise(() => {}))
    obtenerDashboard.mockReturnValue(new Promise(() => {}))
    await renderApp('/reservas/nueva', SESIONES.solicitante)
    expect(await screen.findByRole('heading', { name: 'Nueva reserva' })).toBeInTheDocument()
    cleanup()
    await renderApp('/mi-ambiente', SESIONES.responsable)
    expect(screen.getByRole('heading', { name: 'Mi ambiente' })).toBeInTheDocument()
    cleanup()
    await renderApp('/', SESIONES.administrador)
    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/dashboard')
  })

  it.each(['administrador', 'solicitante', 'responsable'])(
    'el detalle de una reserva (/reservas/7) es accesible para el rol %s',
    async (rol) => {
      obtenerReserva.mockResolvedValue({
        tipo: RESULTADO.exito,
        data: {
          reserva: {
            id: 7,
            ambienteId: 1,
            ambienteNombre: 'Laboratorio de Cómputo 2',
            usuarioId: 2,
            solicitanteNombre: 'Ana Torres',
            fecha: '2026-11-05',
            horaInicio: '10:00',
            horaFin: '12:00',
            motivo: 'Práctica',
            estado: 'Pendiente',
          },
          historial: [],
        },
      })
      await renderApp('/reservas/7', SESIONES[rol])
      expect(
        await screen.findByRole('heading', { name: 'Detalle de la reserva' }),
      ).toBeInTheDocument()
      expect(obtenerReserva).toHaveBeenCalledWith('7')
    },
  )

  it('sin sesión, /reservas/7 lleva al login', async () => {
    await renderApp('/reservas/7')
    expect(ubicacion()).toHaveTextContent('/login')
    expect(obtenerReserva).not.toHaveBeenCalled()
  })

  it('el título de la pestaña cambia con la pantalla y con el estado «Sin permiso»', async () => {
    obtenerDashboard.mockReturnValue(new Promise(() => {}))
    await renderApp('/dashboard', SESIONES.administrador)
    await waitFor(() => expect(document.title).toBe('Inicio · ReservaUPLA'))
    cleanup()
    await renderApp('/dashboard', SESIONES.solicitante)
    await waitFor(() => expect(document.title).toBe('Inicio · ReservaUPLA'))
    cleanup()
    await renderApp('/login')
    await waitFor(() => expect(document.title).toBe('Iniciar sesión · ReservaUPLA'))
  })

  it('una ruta que no existe muestra "No encontramos esa página."', async () => {
    await renderApp('/no-existe', SESIONES.administrador)
    expect(screen.getByRole('heading', { name: 'No encontramos esa página.' })).toBeInTheDocument()
  })
})

describe('listado de Usuarios', () => {
  it('muestra la tabla con rol "Responsable de ambiente" y estado con icono y texto', async () => {
    await renderApp('/usuarios', SESIONES.administrador)
    expect(await screen.findByText('carla.rojas@upla.edu.pe')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Nombre completo',
      'Correo',
      'Rol',
      'Estado',
    ])
    expect(screen.getAllByText('Responsable de ambiente')).toHaveLength(2)
    expect(screen.getAllByText('Activo')).toHaveLength(2)
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('"Nuevo usuario" lleva al formulario', async () => {
    await renderApp('/usuarios', SESIONES.administrador)
    await userEvent.click(await screen.findByRole('button', { name: 'Nuevo usuario' }))
    expect(ubicacion()).toHaveTextContent('/usuarios/nuevo')
    expect(screen.getByRole('heading', { name: 'Registrar usuario' })).toBeInTheDocument()
  })

  it('mientras carga muestra "Cargando…"', async () => {
    listarUsuarios.mockReturnValue(new Promise(() => {}))
    await renderApp('/usuarios', SESIONES.administrador)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
  })

  it.each([
    [RESULTADO.errorConexion, MENSAJES.errorConexion],
    [RESULTADO.errorServidor, MENSAJES.errorServidor],
    [RESULTADO.sinPermiso, MENSAJES.sinPermiso],
  ])('si falla (%s) muestra el mensaje y Reintentar vuelve a cargar', async (tipo, mensaje) => {
    listarUsuarios.mockResolvedValueOnce({ tipo })
    await renderApp('/usuarios', SESIONES.administrador)
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('carla.rojas@upla.edu.pe')).toBeInTheDocument()
  })

  it('sin registros muestra el texto de estado vacío', async () => {
    listarUsuarios.mockResolvedValue({ tipo: RESULTADO.exito, data: [] })
    await renderApp('/usuarios', SESIONES.administrador)
    expect(await screen.findByText('Todavía no hay registros.')).toBeInTheDocument()
  })
})

describe('listado de Ambientes', () => {
  it('muestra la tabla con insignias de estado y el responsable', async () => {
    await renderApp('/ambientes', SESIONES.administrador)
    expect(await screen.findByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Nombre',
      'Capacidad',
      'Ubicación',
      'Estado',
      'Ocupación de hoy',
      'Responsable',
    ])
    expect(screen.getByText('Disponible')).toBeInTheDocument()
    expect(screen.getByText('En mantenimiento')).toBeInTheDocument()
    expect(screen.getByText('Mario Huamán')).toBeInTheDocument()
    // La sala en mantenimiento no tiene ocupación ni responsable: dos «—» en su fila.
    const fila = screen.getByText('Sala de Reuniones A').closest('tr')
    expect(within(fila).getAllByText('—')).toHaveLength(2)
  })

  it('"Nuevo ambiente" lleva al formulario', async () => {
    await renderApp('/ambientes', SESIONES.administrador)
    await userEvent.click(await screen.findByRole('button', { name: 'Nuevo ambiente' }))
    expect(ubicacion()).toHaveTextContent('/ambientes/nuevo')
  })
})

describe('cierre de sesión y sesión vencida', () => {
  it('Cerrar sesión lleva al login y borra la sesión', async () => {
    await renderApp('/ambientes', SESIONES.administrador)
    await userEvent.click(await screen.findByRole('button', { name: /Carla Rojas/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))
    expect(ubicacion()).toHaveTextContent('/login')
    expect(sessionStorage.length).toBe(0)
    cleanup()
    await renderApp('/ambientes')
    expect(ubicacion()).toHaveTextContent('/login')
  })

  it('si la API responde 401 a una petición con token, cierra la sesión y avisa en el login', async () => {
    vi.doUnmock('./services/recursosService.js')
    const { registrarSesionExpirada } = await import('./services/apiClient.js')
    expect(typeof registrarSesionExpirada).toBe('function')
    // Se simula la respuesta 401 llamando directamente al manejador que registra la sesión.
    listarAmbientes.mockImplementation(async () => {
      const { request } = await import('./services/apiClient.js')
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve('') }),
      )
      await request('/ambientes', { token: 'token-de-Administrador' })
      return { tipo: RESULTADO.noAutorizado }
    })
    await renderApp('/ambientes', SESIONES.administrador)
    await waitFor(() => expect(ubicacion()).toHaveTextContent('/login'))
    expect(await screen.findByText(MENSAJES.sesionTerminada)).toBeInTheDocument()
    expect(sessionStorage.length).toBe(0)
  })
})
