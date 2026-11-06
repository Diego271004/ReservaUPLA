import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MENSAJES } from '../constants/messages.js'
import { RESULTADO } from '../services/llamarApi.js'
import {
  listarAmbientes,
  listarUsuarios,
  obtenerDisponibilidadDia,
} from '../services/recursosService.js'
import { SESIONES, renderEnRuta } from '../test/utils.jsx'
import AmbientesPage from './AmbientesPage.jsx'
import UsuariosPage from './UsuariosPage.jsx'

vi.mock('../services/recursosService.js', () => ({
  listarAmbientes: vi.fn(),
  listarUsuarios: vi.fn(),
  obtenerDisponibilidadDia: vi.fn(),
}))

const exito = (datos) => ({ tipo: RESULTADO.exito, data: datos })

const AMBIENTES = [
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

const DIA = {
  fecha: '2026-11-05',
  soloLectura: false,
  ambientes: [
    {
      id: 1,
      nombre: 'Laboratorio de Cómputo 2',
      estado: 'Disponible',
      // 3 h aprobadas de 15 h = 20 %; la pendiente no cuenta.
      bloques: [
        { id: 1, horaInicio: '10:00', horaFin: '13:00', estado: 'Aprobada' },
        { id: 2, horaInicio: '14:00', horaFin: '16:00', estado: 'Pendiente' },
      ],
    },
    { id: 3, nombre: 'Sala de Reuniones A', estado: 'En mantenimiento', bloques: [] },
  ],
}

const USUARIOS = [
  {
    id: 1,
    nombreCompleto: 'Carla Rojas',
    correo: 'carla.rojas@upla.edu.pe',
    rol: 'Administrador',
    activo: true,
  },
  {
    id: 2,
    nombreCompleto: 'Ana Torres',
    correo: 'ana.torres@upla.edu.pe',
    rol: 'Solicitante',
    activo: true,
  },
  {
    id: 4,
    nombreCompleto: 'Usuario Inactivo',
    correo: 'inactivo@upla.edu.pe',
    rol: 'Solicitante',
    activo: false,
  },
]

beforeEach(() => {
  vi.resetAllMocks()
  listarAmbientes.mockResolvedValue(exito(AMBIENTES))
  obtenerDisponibilidadDia.mockResolvedValue(exito(DIA))
  listarUsuarios.mockResolvedValue(exito(USUARIOS))
})

const mostrarAmbientes = () =>
  renderEnRuta(<AmbientesPage />, { ruta: '/ambientes', sesionInicial: SESIONES.administrador })
const mostrarUsuarios = () =>
  renderEnRuta(<UsuariosPage />, { ruta: '/usuarios', sesionInicial: SESIONES.administrador })

describe('Ambientes: cabecera, ocupación y responsable', () => {
  it('el título, el resumen «2 ambientes · 1 en mantenimiento» y «Nuevo ambiente» en la cabecera', async () => {
    mostrarAmbientes()
    expect(await screen.findByText('2 ambientes · 1 en mantenimiento')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Ambientes' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo ambiente' }))
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/ambientes/nuevo')
  })

  it('mientras carga no hay resumen', () => {
    listarAmbientes.mockReturnValue(new Promise(() => {}))
    mostrarAmbientes()
    expect(screen.queryByText(/ambientes ·/)).not.toBeInTheDocument()
  })

  it('«Ocupación de hoy» cuenta solo las reservas aprobadas: 3 h de 15 h = 20 %', async () => {
    mostrarAmbientes()
    expect(
      await screen.findByRole('img', {
        name: 'Ocupación de hoy de Laboratorio de Cómputo 2: 20 %',
      }),
    ).toBeInTheDocument()
  })

  it('un ambiente en mantenimiento no tiene ocupación: muestra «—»', async () => {
    mostrarAmbientes()
    const fila = (await screen.findByText('Sala de Reuniones A')).closest('tr')
    expect(within(fila).queryByRole('img')).not.toBeInTheDocument()
    expect(within(fila).getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('si falla la ocupación la lista sigue y la columna muestra «—»', async () => {
    obtenerDisponibilidadDia.mockResolvedValue({ tipo: RESULTADO.errorServidor })
    mostrarAmbientes()
    const fila = (await screen.findByText('Laboratorio de Cómputo 2')).closest('tr')
    expect(within(fila).queryByRole('img', { name: /Ocupación/ })).not.toBeInTheDocument()
  })

  it('el responsable lleva su avatar con iniciales (decorativo) y su nombre escrito', async () => {
    mostrarAmbientes()
    const fila = (await screen.findByText('Laboratorio de Cómputo 2')).closest('tr')
    expect(within(fila).getByText('Mario Huamán')).toBeInTheDocument()
    expect(within(fila).getByText('MH')).toHaveAttribute('aria-hidden', 'true')
  })

  it('si falla la lista muestra el error con «Reintentar» y sin resumen', async () => {
    listarAmbientes.mockResolvedValueOnce({ tipo: RESULTADO.errorServidor })
    mostrarAmbientes()
    expect(await screen.findByText(MENSAJES.errorServidor, { exact: false })).toBeInTheDocument()
    expect(screen.queryByText(/ambientes ·/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('2 ambientes · 1 en mantenimiento')).toBeInTheDocument()
  })

  it('alternador de vista (tarjetas/tabla) persiste en localStorage y muestra tarjetas con ocupación', async () => {
    mostrarAmbientes()
    await screen.findByText('Laboratorio de Cómputo 2')
    const botonTarjetas = screen.getByRole('button', { name: /Tarjetas/i })
    await userEvent.click(botonTarjetas)
    expect(localStorage.getItem('reservaupla.vistaAmbientes')).toBe('tarjetas')
    const regionTarjetas = await screen.findByRole('region', { name: 'Ambientes en tarjetas' })
    expect(within(regionTarjetas).getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(
      within(regionTarjetas).getByRole('img', {
        name: 'Ocupación de hoy de Laboratorio de Cómputo 2: 20 %',
      }),
    ).toBeInTheDocument()
    const botonTabla = screen.getByRole('button', { name: /Tabla/i })
    await userEvent.click(botonTabla)
    expect(localStorage.getItem('reservaupla.vistaAmbientes')).toBe('tabla')
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})

describe('Usuarios: cabecera y avatares', () => {
  it('el título, el resumen «3 usuarios · 2 activos» y «Nuevo usuario» en la cabecera', async () => {
    mostrarUsuarios()
    expect(await screen.findByText('3 usuarios · 2 activos')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo usuario' }))
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/usuarios/nuevo')
  })

  it('cada nombre lleva su avatar con iniciales y el estado con icono y texto', async () => {
    mostrarUsuarios()
    const fila = (await screen.findByText('Usuario Inactivo')).closest('tr')
    expect(within(fila).getByText('UI')).toHaveAttribute('aria-hidden', 'true')
    expect(within(fila).getByText('Inactivo')).toBeInTheDocument()
    const filaActiva = screen.getByText('Ana Torres').closest('tr')
    expect(within(filaActiva).getByText('AT')).toBeInTheDocument()
    expect(within(filaActiva).getByText('Activo')).toBeInTheDocument()
  })

  it('con un solo usuario activo el resumen va en singular', async () => {
    listarUsuarios.mockResolvedValue(exito([USUARIOS[0]]))
    mostrarUsuarios()
    expect(await screen.findByText('1 usuario · 1 activo')).toBeInTheDocument()
  })

  it('buscador de usuarios filtra en vivo por nombre, correo y rol', async () => {
    mostrarUsuarios()
    await screen.findByText('Carla Rojas')
    const buscador = screen.getByLabelText('Buscar usuarios')
    await userEvent.type(buscador, 'ana')
    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
    expect(screen.queryByText('Carla Rojas')).not.toBeInTheDocument()
    await userEvent.clear(buscador)
    await userEvent.type(buscador, 'inactivo@upla.edu.pe')
    expect(screen.getByText('Usuario Inactivo')).toBeInTheDocument()
    expect(screen.queryByText('Ana Torres')).not.toBeInTheDocument()
    await userEvent.clear(buscador)
    await userEvent.type(buscador, 'Administrador')
    expect(screen.getByText('Carla Rojas')).toBeInTheDocument()
    expect(screen.queryByText('Ana Torres')).not.toBeInTheDocument()
  })

  it('buscador sin resultados muestra mensaje de estado vacío explicativo', async () => {
    mostrarUsuarios()
    await screen.findByText('Carla Rojas')
    const buscador = screen.getByLabelText('Buscar usuarios')
    await userEvent.type(buscador, 'inexistente')
    expect(
      screen.getByText('No se encontraron usuarios que coincidan con «inexistente».'),
    ).toBeInTheDocument()
  })
})
