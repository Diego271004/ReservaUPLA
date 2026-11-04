import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RESULTADO } from '../services/llamarApi.js'
import { obtenerMiAmbiente } from '../services/recursosService.js'
import { SESIONES, renderEnRuta } from '../test/utils.jsx'
import MiAmbientePage from './MiAmbientePage.jsx'

vi.mock('../services/recursosService.js', () => ({
  obtenerMiAmbiente: vi.fn(),
}))

const exito = (datos) => ({ tipo: RESULTADO.exito, data: datos })

const LAB = {
  id: 1,
  nombre: 'Laboratorio de Cómputo 2',
  ubicacion: 'Pabellón A, piso 2',
  capacidad: 30,
  estado: 'Disponible',
}
const SALA = {
  id: 3,
  nombre: 'Sala de Reuniones A',
  ubicacion: 'Pabellón A, piso 3',
  capacidad: 12,
  estado: 'Disponible',
}

const reserva = (id, estado, solicitante = 'Ana Torres') => ({
  id,
  ambienteId: 1,
  ambienteNombre: LAB.nombre,
  usuarioId: 2,
  solicitanteNombre: solicitante,
  fecha: '2026-11-05',
  horaInicio: '10:00',
  horaFin: '12:00',
  motivo: 'Práctica',
  estado,
})

const panel = (extra = {}) => ({
  ambiente: LAB,
  ambientes: [LAB],
  indicadores: { total: 5, pendientes: 1, aprobadas: 3, rechazadas: 1 },
  reservas: {
    elementos: [
      reserva(1, 'Aprobada'),
      reserva(2, 'Pendiente', 'Luis Quispe'),
      reserva(3, 'Rechazada'),
      reserva(4, 'Cancelada'),
    ],
    total: 4,
    pagina: 1,
    tamano: 10,
  },
  ...extra,
})

const mostrar = (ruta = '/mi-ambiente') =>
  renderEnRuta(<MiAmbientePage />, { ruta, sesionInicial: SESIONES.responsable })

beforeEach(() => {
  vi.resetAllMocks()
  obtenerMiAmbiente.mockResolvedValue(exito(panel()))
})

describe('Mi ambiente', () => {
  it('muestra el título y mientras carga «Cargando…»', () => {
    obtenerMiAmbiente.mockReturnValue(new Promise(() => {}))
    mostrar()
    expect(screen.getByRole('heading', { name: 'Mi ambiente' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(TEXTOS.cargando)
  })

  it('muestra el ambiente con su ubicación y capacidad', async () => {
    mostrar()
    const tarjeta = await screen.findByRole('region', { name: LAB.nombre })
    expect(within(tarjeta).getByRole('heading', { name: LAB.nombre })).toBeInTheDocument()
    expect(tarjeta).toHaveTextContent('Ubicación: Pabellón A, piso 2')
    expect(tarjeta).toHaveTextContent('Capacidad: 30 personas')
  })

  it('muestra las cuatro tarjetas de SU ambiente (sin «ambiente más utilizado»)', async () => {
    mostrar()
    const indicadores = await screen.findByRole('region', { name: 'Indicadores' })
    const tarjetas = within(indicadores).getAllByRole('article')
    expect(tarjetas).toHaveLength(4)
    expect(tarjetas[0]).toHaveTextContent('5Total de reservas')
    expect(tarjetas[1]).toHaveTextContent('1Reservas pendientes')
    expect(tarjetas[2]).toHaveTextContent('3Reservas aprobadas')
    expect(tarjetas[3]).toHaveTextContent('1Reservas rechazadas')
    expect(screen.queryByText(TEXTOS.indicadorMasUtilizado)).not.toBeInTheDocument()
  })

  it('el total de su ambiente también aclara que incluye canceladas', async () => {
    mostrar()
    const indicadores = await screen.findByRole('region', { name: 'Indicadores' })
    expect(within(indicadores).getByText('Total de reservas').closest('article')).toHaveTextContent(
      'Incluye canceladas',
    )
  })

  it('«Uso del ambiente»: la tabla con fecha, horario, solicitante y estado con insignia', async () => {
    mostrar()
    const tabla = await screen.findByRole('table', { name: TEXTOS.usoDelAmbiente })
    for (const encabezado of ['Fecha', 'Horario', 'Solicitante', 'Estado']) {
      expect(within(tabla).getByRole('columnheader', { name: encabezado })).toBeInTheDocument()
    }
    expect(within(tabla).queryByRole('columnheader', { name: 'Acciones' })).not.toBeInTheDocument()
    expect(within(tabla).getAllByRole('row')).toHaveLength(5)
    for (const estado of ['Aprobada', 'Pendiente', 'Rechazada', 'Cancelada']) {
      expect(within(tabla).getByText(estado)).toBeInTheDocument()
    }
    expect(within(tabla).getByText('Luis Quispe')).toBeInTheDocument()
  })

  it('es de solo lectura: ningún botón de aprobar, rechazar ni cancelar', async () => {
    mostrar()
    await screen.findByRole('table')
    expect(
      screen.queryByRole('button', { name: /Aprobar|Rechazar|Cancelar/ }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('con un solo ambiente no ofrece elegir otro', async () => {
    mostrar()
    await screen.findByRole('table')
    expect(screen.queryByLabelText('Ambiente')).not.toBeInTheDocument()
  })

  it('con varios ambientes ofrece elegir cuál mira y pide el elegido', async () => {
    obtenerMiAmbiente
      .mockResolvedValueOnce(exito(panel({ ambientes: [LAB, SALA] })))
      .mockResolvedValueOnce(exito(panel({ ambiente: SALA, ambientes: [LAB, SALA] })))
    mostrar()
    const lista = await screen.findByLabelText('Ambiente')
    expect(
      within(lista)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual([LAB.nombre, SALA.nombre])
    expect(lista).toHaveValue('1')
    await userEvent.selectOptions(lista, SALA.nombre)
    await waitFor(() =>
      expect(obtenerMiAmbiente).toHaveBeenLastCalledWith({ ambienteId: '3', pagina: 1 }),
    )
    expect(await screen.findByRole('heading', { name: SALA.nombre })).toBeInTheDocument()
  })

  it('sin ambiente a cargo lo dice y no dibuja tarjetas ni tabla', async () => {
    obtenerMiAmbiente.mockResolvedValue(exito(panel({ ambiente: null, ambientes: [] })))
    mostrar()
    expect(await screen.findByText(TEXTOS.sinAmbienteAsignado)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Indicadores' })).not.toBeInTheDocument()
  })

  it('con el ambiente sin reservas muestra el estado vacío', async () => {
    obtenerMiAmbiente.mockResolvedValue(
      exito(
        panel({
          indicadores: { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0 },
          reservas: { elementos: [], total: 0, pagina: 1, tamano: 10 },
        }),
      ),
    )
    mostrar()
    expect(await screen.findByText(TEXTOS.sinReservas)).toBeInTheDocument()
  })

  it('pie «Mostrando 4 de 4» y, con 23, paginación que pide la página 2', async () => {
    mostrar()
    expect(await screen.findByText('Mostrando 4 de 4')).toBeInTheDocument()
    obtenerMiAmbiente.mockResolvedValue(
      exito(
        panel({
          reservas: { elementos: [reserva(1, 'Aprobada')], total: 23, pagina: 1, tamano: 10 },
        }),
      ),
    )
    mostrar('/mi-ambiente?ambienteId=1')
    await userEvent.click(await screen.findByRole('button', { name: 'Siguiente' }))
    await waitFor(() =>
      expect(obtenerMiAmbiente).toHaveBeenLastCalledWith({ ambienteId: '1', pagina: 2 }),
    )
  })

  it.each([
    ['errorConexion', MENSAJES.errorConexion],
    ['errorServidor', MENSAJES.errorServidor],
    ['sinPermiso', MENSAJES.sinPermiso],
    ['noEncontrado', MENSAJES.errorServidor],
  ])(
    'si la carga falla (%s) muestra el mensaje y Reintentar vuelve a pedir',
    async (tipo, mensaje) => {
      obtenerMiAmbiente.mockResolvedValueOnce({ tipo: RESULTADO[tipo] })
      mostrar()
      expect(await screen.findByText(mensaje, { exact: false })).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
      expect(await screen.findByRole('table')).toBeInTheDocument()
    },
  )

  it('solo con teclado: Tab llega a la lista de ambientes y la elige', async () => {
    obtenerMiAmbiente.mockResolvedValue(exito(panel({ ambientes: [LAB, SALA] })))
    mostrar()
    const lista = await screen.findByLabelText('Ambiente')
    await userEvent.tab()
    expect(lista).toHaveFocus()
  })
})
