import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RESULTADO } from '../services/llamarApi.js'
import {
  aprobarReserva,
  cancelarReserva,
  obtenerReserva,
  rechazarReserva,
} from '../services/recursosService.js'
import { SESIONES, renderEnRuta } from '../test/utils.jsx'
import DetalleReservaPage from './DetalleReservaPage.jsx'

vi.mock('../services/recursosService.js', () => ({
  aprobarReserva: vi.fn(),
  cancelarReserva: vi.fn(),
  obtenerReserva: vi.fn(),
  rechazarReserva: vi.fn(),
}))

const CONFLICTO =
  'Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00. Elige otro horario u otro ambiente.'

// 03/11/2026 12:05 hora local, para que el texto del historial no dependa de la zona horaria de quien ejecuta la prueba.
const FECHA_EVENTO = new Date(2026, 10, 3, 12, 5).toISOString()

function detalle(estado = 'Pendiente', historialExtra = []) {
  return {
    reserva: {
      id: 7,
      ambienteId: 1,
      ambienteNombre: 'Laboratorio de Cómputo 2',
      usuarioId: 2,
      solicitanteNombre: 'Ana Torres',
      fecha: '2026-11-05',
      horaInicio: '10:00',
      horaFin: '12:00',
      motivo: 'Práctica de programación',
      estado,
    },
    historial: [
      {
        id: 1,
        estadoAnterior: null,
        estadoNuevo: 'Pendiente',
        usuarioNombre: 'Ana Torres',
        fecha: FECHA_EVENTO,
      },
      ...historialExtra,
    ],
  }
}

const exito = (datos) => ({ tipo: RESULTADO.exito, data: datos })
const pendiente = () => new Promise(() => {})

const mostrar = (sesion = SESIONES.administrador) =>
  renderEnRuta(<DetalleReservaPage />, {
    ruta: '/reservas/7',
    rutaDelElemento: '/reservas/:id',
    sesionInicial: sesion,
  })

const boton = (nombre) => screen.getByRole('button', { name: nombre })
const sinBoton = (nombre) =>
  expect(screen.queryByRole('button', { name: nombre })).not.toBeInTheDocument()

beforeEach(() => {
  vi.resetAllMocks()
  obtenerReserva.mockResolvedValue(exito(detalle()))
})

describe('Detalle de reserva: carga y errores', () => {
  it('mientras carga muestra "Cargando la reserva…"', () => {
    obtenerReserva.mockReturnValue(pendiente())
    mostrar()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando la reserva…')
  })

  it('pide la reserva del identificador de la ruta', async () => {
    mostrar()
    await screen.findByRole('heading', { name: 'Detalle de la reserva' })
    expect(obtenerReserva).toHaveBeenCalledWith('7')
  })

  it('muestra los datos, el estado con insignia y el historial con quién y cuándo', async () => {
    obtenerReserva.mockResolvedValue(
      exito(
        detalle('Aprobada', [
          {
            id: 2,
            estadoAnterior: 'Pendiente',
            estadoNuevo: 'Aprobada',
            usuarioNombre: 'Carla Rojas',
            fecha: FECHA_EVENTO,
          },
        ]),
      ),
    )
    mostrar()
    expect(await screen.findByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(screen.getByText('Ana Torres', { selector: 'dd' })).toBeInTheDocument()
    expect(screen.getByText('05/11/2026')).toBeInTheDocument()
    expect(screen.getByText('10:00 – 12:00')).toBeInTheDocument()
    expect(screen.getByText('Práctica de programación')).toBeInTheDocument()
    expect(screen.getByText('Aprobada', { selector: 'span' })).toBeInTheDocument()
    expect(
      screen.getByText('Solicitud registrada por Ana Torres, 03/11/2026 12:05'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Reserva aprobada por Carla Rojas, 03/11/2026 12:05'),
    ).toBeInTheDocument()
  })

  it('una reserva que no existe (404) muestra "No encontramos esa reserva."', async () => {
    obtenerReserva.mockResolvedValue({ tipo: RESULTADO.noEncontrado })
    mostrar()
    expect(
      await screen.findByRole('heading', { name: MENSAJES_RESERVA_NO_ENCONTRADA }),
    ).toBeInTheDocument()
  })

  it.each([
    [RESULTADO.errorConexion, MENSAJES.errorConexion],
    [RESULTADO.errorServidor, MENSAJES.errorServidor],
    [RESULTADO.sinPermiso, MENSAJES.sinPermiso],
  ])(
    'si la carga falla (%s) muestra el mensaje y Reintentar vuelve a cargar',
    async (tipo, mensaje) => {
      obtenerReserva.mockResolvedValueOnce({ tipo })
      mostrar()
      expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
      await userEvent.click(boton('Reintentar'))
      expect(await screen.findByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    },
  )
})

const MENSAJES_RESERVA_NO_ENCONTRADA = 'No encontramos esa reserva.'

describe('Detalle de reserva: acciones según el rol y el estado (RN-05 y RN-06)', () => {
  it('Administrador con una reserva Pendiente: Aprobar, Rechazar y Cancelar reserva, todos habilitados', async () => {
    mostrar()
    await screen.findByText('Laboratorio de Cómputo 2')
    for (const nombre of ['Aprobar', 'Rechazar', 'Cancelar reserva']) {
      expect(boton(nombre)).toBeEnabled()
    }
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('el orden visual: Cancelar reserva a la izquierda, separado, y el primario Aprobar al extremo derecho', async () => {
    mostrar()
    await screen.findByText('Laboratorio de Cómputo 2')
    const botones = within(screen.getByTestId('acciones-reserva'))
      .getAllByRole('button')
      .map((b) => b.textContent)
    expect(botones).toEqual(['Cancelar reserva', 'Rechazar', 'Aprobar'])
  })

  it('Administrador con una reserva Aprobada: solo puede cancelarla', async () => {
    obtenerReserva.mockResolvedValue(exito(detalle('Aprobada')))
    mostrar()
    await screen.findByText('Laboratorio de Cómputo 2')
    expect(boton('Cancelar reserva')).toBeEnabled()
    sinBoton('Aprobar')
    sinBoton('Rechazar')
  })

  it('05c RN-06: una reserva Rechazada muestra las acciones deshabilitadas y el aviso informativo', async () => {
    obtenerReserva.mockResolvedValue(exito(detalle('Rechazada')))
    mostrar()
    expect(await screen.findByText(MENSAJES.reservaRechazadaNoSeModifica)).toBeInTheDocument()
    expect(
      screen.getByText(MENSAJES.reservaRechazadaNoSeModifica).closest('[role="status"]'),
    ).toBeInTheDocument()
    for (const nombre of ['Aprobar', 'Rechazar', 'Cancelar reserva']) {
      expect(boton(nombre)).toBeDisabled()
    }
  })

  it('RN-06: una reserva Cancelada muestra su aviso y las acciones deshabilitadas', async () => {
    obtenerReserva.mockResolvedValue(exito(detalle('Cancelada')))
    mostrar()
    expect(await screen.findByText(MENSAJES.reservaCanceladaNoSeModifica)).toBeInTheDocument()
    for (const nombre of ['Aprobar', 'Rechazar', 'Cancelar reserva']) {
      expect(boton(nombre)).toBeDisabled()
    }
  })

  it('05f RN-05: la Solicitante no ve Aprobar ni Rechazar; solo Cancelar solicitud', async () => {
    mostrar(SESIONES.solicitante)
    await screen.findByText('Laboratorio de Cómputo 2')
    expect(boton('Cancelar solicitud')).toBeEnabled()
    sinBoton('Aprobar')
    sinBoton('Rechazar')
    sinBoton('Cancelar reserva')
  })

  it('la Solicitante con una reserva Rechazada: Cancelar solicitud deshabilitado y el aviso', async () => {
    obtenerReserva.mockResolvedValue(exito(detalle('Rechazada')))
    mostrar(SESIONES.solicitante)
    expect(await screen.findByText(MENSAJES.reservaRechazadaNoSeModifica)).toBeInTheDocument()
    expect(boton('Cancelar solicitud')).toBeDisabled()
  })

  it('RN-05: la Responsable no ve ninguna acción ni aviso, solo la información', async () => {
    mostrar(SESIONES.responsable)
    await screen.findByText('Laboratorio de Cómputo 2')
    expect(screen.queryByTestId('acciones-reserva')).not.toBeInTheDocument()
    sinBoton('Aprobar')
    sinBoton('Rechazar')
    sinBoton('Cancelar reserva')
    sinBoton('Cancelar solicitud')
  })

  it('"Volver a Reservas" es el enlace de regreso', async () => {
    mostrar()
    expect(await screen.findByRole('link', { name: 'Volver a Reservas' })).toHaveAttribute(
      'href',
      '/reservas',
    )
  })
})

describe('Detalle de reserva: modales y acciones', () => {
  const casos = [
    {
      accion: 'aprobar',
      servicio: () => aprobarReserva,
      abrir: 'Aprobar',
      titulo: '¿Aprobar esta reserva?',
      confirmar: 'Sí, aprobar',
      exito: MENSAJES_EXITO('Reserva aprobada.'),
      estadoNuevo: 'Aprobada',
    },
    {
      accion: 'rechazar',
      servicio: () => rechazarReserva,
      abrir: 'Rechazar',
      titulo: '¿Rechazar esta reserva?',
      confirmar: 'Sí, rechazar',
      exito: MENSAJES_EXITO('Reserva rechazada.'),
      estadoNuevo: 'Rechazada',
    },
    {
      accion: 'cancelar',
      servicio: () => cancelarReserva,
      abrir: 'Cancelar reserva',
      titulo: '¿Cancelar esta reserva?',
      confirmar: 'Sí, cancelar reserva',
      exito: MENSAJES_EXITO('Reserva cancelada.'),
      estadoNuevo: 'Cancelada',
    },
  ]

  function MENSAJES_EXITO(texto) {
    return texto
  }

  describe.each(casos)(
    '$accion',
    ({ servicio, abrir, titulo, confirmar, exito: mensajeExito, estadoNuevo }) => {
      it('abrir: muestra el modal con el resumen (ambiente, solicitante, horario) y el foco en Volver', async () => {
        mostrar()
        await screen.findByText('Laboratorio de Cómputo 2')
        await userEvent.click(boton(abrir))
        const dialogo = screen.getByRole('dialog', { name: titulo })
        expect(within(dialogo).getByText('Ambiente: Laboratorio de Cómputo 2')).toBeInTheDocument()
        expect(within(dialogo).getByText('Solicitante: Ana Torres')).toBeInTheDocument()
        expect(within(dialogo).getByText('Horario: 05/11/2026, 10:00 – 12:00')).toBeInTheDocument()
        expect(within(dialogo).getByRole('button', { name: 'Volver' })).toHaveFocus()
        expect(servicio()).not.toHaveBeenCalled()
      })

      it('volver: cierra sin llamar a la API y devuelve el foco al botón', async () => {
        mostrar()
        await screen.findByText('Laboratorio de Cómputo 2')
        await userEvent.click(boton(abrir))
        await userEvent.click(boton('Volver'))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(servicio()).not.toHaveBeenCalled()
        expect(boton(abrir)).toHaveFocus()
      })

      it('confirmar: llama a la API, cierra el modal, muestra el mensaje de éxito y el estado nuevo', async () => {
        servicio().mockResolvedValue(
          exito(
            detalle(estadoNuevo, [
              {
                id: 2,
                estadoAnterior: 'Pendiente',
                estadoNuevo,
                usuarioNombre: 'Carla Rojas',
                fecha: FECHA_EVENTO,
              },
            ]),
          ),
        )
        mostrar()
        await screen.findByText('Laboratorio de Cómputo 2')
        await userEvent.click(boton(abrir))
        await userEvent.click(boton(confirmar))
        expect(await screen.findByText(mensajeExito)).toBeInTheDocument()
        expect(servicio()).toHaveBeenCalledWith(7)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(screen.getByText(estadoNuevo, { selector: 'span' })).toBeInTheDocument()
        expect(
          screen.getByText(
            `Reserva ${estadoNuevo.toLowerCase()} por Carla Rojas, 03/11/2026 12:05`,
          ),
        ).toBeInTheDocument()
      })

      it('cargando: el botón de confirmar muestra "Guardando…" y no se repite la acción', async () => {
        servicio().mockReturnValue(pendiente())
        mostrar()
        await screen.findByText('Laboratorio de Cómputo 2')
        await userEvent.click(boton(abrir))
        await userEvent.click(boton(confirmar))
        const guardando = boton('Guardando…')
        expect(guardando).toHaveAttribute('aria-busy', 'true')
        await userEvent.click(guardando)
        expect(servicio()).toHaveBeenCalledTimes(1)
      })

      it.each([
        [{ tipo: RESULTADO.conflicto, mensaje: CONFLICTO }, CONFLICTO],
        [{ tipo: RESULTADO.sinPermiso }, MENSAJES.sinPermiso],
        [{ tipo: RESULTADO.errorServidor }, MENSAJES.errorServidor],
        [{ tipo: RESULTADO.errorConexion }, MENSAJES.errorConexion],
        [{ tipo: RESULTADO.noEncontrado }, MENSAJES_RESERVA_NO_ENCONTRADA],
      ])(
        'error %# : cierra el modal y muestra el mensaje sin cambiar el estado',
        async (resultado, mensaje) => {
          servicio().mockResolvedValue(resultado)
          mostrar()
          await screen.findByText('Laboratorio de Cómputo 2')
          await userEvent.click(boton(abrir))
          await userEvent.click(boton(confirmar))
          expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
          expect(screen.getByText('Pendiente', { selector: 'span' })).toBeInTheDocument()
          expect(boton(abrir)).toBeEnabled()
        },
      )

      it('Escape cierra el modal sin llamar a la API', async () => {
        mostrar()
        await screen.findByText('Laboratorio de Cómputo 2')
        await userEvent.click(boton(abrir))
        await userEvent.keyboard('{Escape}')
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(servicio()).not.toHaveBeenCalled()
      })
    },
  )

  it('05d: el botón de confirmar del rechazo es el rojo sólido y el de aprobar es el primario', async () => {
    mostrar()
    await screen.findByText('Laboratorio de Cómputo 2')
    await userEvent.click(boton('Rechazar'))
    expect(boton('Sí, rechazar').className).toMatch(/confirmarRechazo/)
    await userEvent.click(boton('Volver'))
    await userEvent.click(boton('Aprobar'))
    expect(boton('Sí, aprobar').className).toMatch(/primario/)
  })

  it('05g RN-06: tras rechazar, la reserva queda sin acciones y con el aviso informativo', async () => {
    rechazarReserva.mockResolvedValue(exito(detalle('Rechazada')))
    mostrar()
    await screen.findByText('Laboratorio de Cómputo 2')
    await userEvent.click(boton('Rechazar'))
    await userEvent.click(boton('Sí, rechazar'))
    expect(await screen.findByText(MENSAJES.reservaRechazadaNoSeModifica)).toBeInTheDocument()
    expect(boton('Aprobar')).toBeDisabled()
    expect(boton('Rechazar')).toBeDisabled()
  })

  it('tras aprobar, la reserva solo puede cancelarse', async () => {
    aprobarReserva.mockResolvedValue(exito(detalle('Aprobada')))
    mostrar()
    await screen.findByText('Laboratorio de Cómputo 2')
    await userEvent.click(boton('Aprobar'))
    await userEvent.click(boton('Sí, aprobar'))
    await screen.findByText('Reserva aprobada.')
    sinBoton('Aprobar')
    sinBoton('Rechazar')
    expect(boton('Cancelar reserva')).toBeEnabled()
  })

  it('la Solicitante cancela su solicitud con el modal de cancelar', async () => {
    cancelarReserva.mockResolvedValue(exito(detalle('Cancelada')))
    mostrar(SESIONES.solicitante)
    await screen.findByText('Laboratorio de Cómputo 2')
    await userEvent.click(boton('Cancelar solicitud'))
    expect(screen.getByRole('dialog', { name: '¿Cancelar esta reserva?' })).toBeInTheDocument()
    await userEvent.click(boton('Sí, cancelar reserva'))
    expect(await screen.findByText('Reserva cancelada.')).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.reservaCanceladaNoSeModifica)).toBeInTheDocument()
  })

  it.each([
    ['Rechazar', '¿Rechazar esta reserva?'],
    ['Cancelar reserva', '¿Cancelar esta reserva?'],
  ])(
    'el modal de "%s" avisa que no se puede deshacer (RN-06: queda en un estado final)',
    async (abrir, titulo) => {
      mostrar()
      await screen.findByText('Laboratorio de Cómputo 2')
      await userEvent.click(boton(abrir))
      const dialogo = screen.getByRole('dialog', { name: titulo })
      expect(within(dialogo).getByText(TEXTOS.advertenciaIrreversible)).toBeInTheDocument()
    },
  )

  it('el modal de "Aprobar" no dice que sea irreversible (una aprobada todavía se puede cancelar)', async () => {
    mostrar()
    await screen.findByText('Laboratorio de Cómputo 2')
    await userEvent.click(boton('Aprobar'))
    expect(screen.queryByText(TEXTOS.advertenciaIrreversible)).not.toBeInTheDocument()
  })

  it('un mensaje de éxito anterior desaparece al empezar otra acción', async () => {
    aprobarReserva.mockResolvedValue(exito(detalle('Aprobada')))
    cancelarReserva.mockReturnValue(pendiente())
    mostrar()
    await screen.findByText('Laboratorio de Cómputo 2')
    await userEvent.click(boton('Aprobar'))
    await userEvent.click(boton('Sí, aprobar'))
    await screen.findByText('Reserva aprobada.')
    await userEvent.click(boton('Cancelar reserva'))
    await userEvent.click(boton('Sí, cancelar reserva'))
    await waitFor(() => expect(screen.queryByText('Reserva aprobada.')).not.toBeInTheDocument())
  })
})

describe('Detalle de reserva: solo con teclado', () => {
  it('Tab llega a las acciones, Enter abre el modal, Tab cicla dentro y Enter confirma', async () => {
    aprobarReserva.mockResolvedValue(exito(detalle('Aprobada')))
    mostrar()
    await screen.findByText('Laboratorio de Cómputo 2')
    boton('Aprobar').focus()
    await userEvent.keyboard('{Enter}')
    expect(boton('Volver')).toHaveFocus()
    await userEvent.tab()
    expect(boton('Sí, aprobar')).toHaveFocus()
    await userEvent.tab()
    expect(boton('Volver')).toHaveFocus()
    await userEvent.tab()
    expect(boton('Sí, aprobar')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(await screen.findByText('Reserva aprobada.')).toBeInTheDocument()
    expect(aprobarReserva).toHaveBeenCalledTimes(1)
  })
})
