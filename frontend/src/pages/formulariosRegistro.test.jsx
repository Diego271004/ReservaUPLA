import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MENSAJES } from '../constants/messages.js'
import { RESULTADO } from '../services/llamarApi.js'
import {
  crearAmbiente,
  crearReserva,
  crearUsuario,
  listarAmbientes,
  listarUsuarios,
} from '../services/recursosService.js'
import { SESIONES, renderEnRuta } from '../test/utils.jsx'
import AmbienteFormPage from './AmbienteFormPage.jsx'
import NuevaReservaPage from './NuevaReservaPage.jsx'
import UsuarioFormPage from './UsuarioFormPage.jsx'

vi.mock('../services/recursosService.js', () => ({
  crearAmbiente: vi.fn(),
  crearReserva: vi.fn(),
  crearUsuario: vi.fn(),
  listarAmbientes: vi.fn(),
  listarUsuarios: vi.fn(),
}))

const exito = (data) => ({ tipo: RESULTADO.exito, data })
const pendiente = () => new Promise(() => {})

beforeEach(() => {
  vi.resetAllMocks()
  listarUsuarios.mockResolvedValue(
    exito([
      { id: 3, nombreCompleto: 'Mario Huamán', activo: true },
      { id: 4, nombreCompleto: 'Rosa Chávez', activo: false },
    ]),
  )
  listarAmbientes.mockResolvedValue(
    exito([
      {
        id: 1,
        nombre: 'Laboratorio de Cómputo 2',
        capacidad: 30,
        ubicacion: 'Pabellón A, piso 2',
        estado: 'Disponible',
      },
      {
        id: 3,
        nombre: 'Sala de Reuniones A',
        capacidad: 12,
        ubicacion: 'Pabellón A, piso 3',
        estado: 'En mantenimiento',
      },
    ]),
  )
})

const ingresar = (etiqueta) => screen.getByLabelText(etiqueta)
const boton = (nombre) => screen.getByRole('button', { name: nombre })

// ============================== Usuarios ==============================
describe('Registrar usuario', () => {
  const mostrar = () =>
    renderEnRuta(<UsuarioFormPage />, {
      ruta: '/usuarios/nuevo',
      sesionInicial: SESIONES.administrador,
    })

  async function llenarValido() {
    await userEvent.type(ingresar('Nombre completo'), 'Rosa Chávez')
    await userEvent.type(ingresar('Correo institucional'), 'rosa.chavez@upla.edu.pe')
    await userEvent.selectOptions(ingresar('Rol'), 'Responsable')
    await userEvent.type(ingresar('Contraseña inicial'), 'Clave#123')
  }

  it('muestra el título, los campos del diseño, la ayuda del correo, el interruptor activo y sin requisitos de contraseña (U2)', () => {
    mostrar()
    expect(screen.getByRole('heading', { name: 'Registrar usuario' })).toBeInTheDocument()
    expect(ingresar('Correo institucional')).toHaveAccessibleDescription(
      'Ejemplo: nombre.apellido@upla.edu.pe',
    )
    expect(screen.getByRole('switch', { name: 'Activo' })).toBeChecked()
    expect(ingresar('Contraseña inicial')).not.toHaveAccessibleDescription()
    expect(ingresar('Rol')).toHaveDisplayValue('Selecciona…')
  })

  it('el rol Responsable se muestra como "Responsable de ambiente"', () => {
    mostrar()
    expect(screen.getByRole('option', { name: 'Responsable de ambiente' })).toHaveValue(
      'Responsable',
    )
  })

  it('campos vacíos: no envía y muestra un mensaje en cada campo, enfocando el primero', async () => {
    mostrar()
    await userEvent.click(boton('Guardar usuario'))
    expect(crearUsuario).not.toHaveBeenCalled()
    expect(screen.getByText(MENSAJES.nombreCompletoVacio)).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.correoUsuarioVacio)).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.rolVacio)).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.contrasenaInicialVacia)).toBeInTheDocument()
    expect(ingresar('Nombre completo')).toHaveFocus()
  })

  it('campos inválidos: correo con formato y dominio incorrectos', async () => {
    mostrar()
    await userEvent.type(ingresar('Correo institucional'), 'rosa')
    await userEvent.tab()
    expect(screen.getByText(MENSAJES.correoFormatoInvalido)).toBeInTheDocument()
    await userEvent.clear(ingresar('Correo institucional'))
    await userEvent.type(ingresar('Correo institucional'), 'rosa@gmail.com')
    await userEvent.tab()
    expect(
      screen.getByText('Usa tu correo institucional (termina en @upla.edu.pe).'),
    ).toBeInTheDocument()
  })

  it('campos inválidos: nombre muy largo y contraseña de más de 72 caracteres', async () => {
    mostrar()
    await userEvent.click(ingresar('Nombre completo'))
    await userEvent.paste('a'.repeat(121))
    await userEvent.tab()
    expect(screen.getByText(MENSAJES.nombreCompletoDemasiadoLargo)).toBeInTheDocument()
    await userEvent.click(ingresar('Contraseña inicial'))
    await userEvent.paste('a'.repeat(73))
    await userEvent.tab()
    expect(screen.getByText(MENSAJES.contrasenaInicialDemasiadoLarga)).toBeInTheDocument()
  })

  it('campos válidos: sin errores y envía los datos normalizados', async () => {
    crearUsuario.mockResolvedValue(exito({ id: 9 }))
    mostrar()
    await userEvent.type(ingresar('Nombre completo'), '  Rosa Chávez ')
    await userEvent.type(ingresar('Correo institucional'), ' Rosa.Chavez@UPLA.edu.pe ')
    await userEvent.selectOptions(ingresar('Rol'), 'Responsable')
    await userEvent.click(screen.getByRole('switch', { name: 'Activo' }))
    await userEvent.type(ingresar('Contraseña inicial'), 'Clave#123')
    await userEvent.click(boton('Guardar usuario'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(crearUsuario).toHaveBeenCalledWith(
      {
        nombreCompleto: 'Rosa Chávez',
        correo: 'rosa.chavez@upla.edu.pe',
        rol: 'Responsable',
        activo: false,
        contrasena: 'Clave#123',
      },
      expect.any(Object),
    )
  })

  it('el interruptor cambia de "Activo" a "Inactivo"', async () => {
    mostrar()
    await userEvent.click(screen.getByRole('switch', { name: 'Activo' }))
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('Mostrar / Ocultar la contraseña inicial', async () => {
    mostrar()
    await userEvent.click(boton('Mostrar contraseña inicial'))
    expect(ingresar('Contraseña inicial')).toHaveAttribute('type', 'text')
  })

  it('guardando: el botón muestra "Guardando…", los campos quedan bloqueados y Cancelar se deshabilita', async () => {
    crearUsuario.mockReturnValue(pendiente())
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Guardar usuario'))
    expect(boton('Guardando…')).toHaveAttribute('aria-busy', 'true')
    expect(ingresar('Nombre completo')).toHaveAttribute('readonly')
    expect(ingresar('Rol')).toBeDisabled()
    expect(boton('Cancelar')).toBeDisabled()
  })

  it('no permite un doble envío', async () => {
    crearUsuario.mockReturnValue(pendiente())
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Guardar usuario'))
    await userEvent.click(boton('Guardando…'))
    expect(crearUsuario).toHaveBeenCalledTimes(1)
  })

  it('éxito: vuelve a Usuarios con el mensaje "Usuario registrado."', async () => {
    crearUsuario.mockResolvedValue(exito({ id: 9 }))
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Guardar usuario'))
    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent('/usuarios'))
    expect(JSON.parse(screen.getByTestId('ubicacion').dataset.state)).toEqual({
      exito: MENSAJES.usuarioRegistrado,
    })
  })

  it('error del servidor por campo: "Ese correo ya está registrado." bajo el correo y con el foco', async () => {
    crearUsuario.mockResolvedValue({
      tipo: RESULTADO.datosInvalidos,
      errores: { correo: MENSAJES.correoYaRegistrado },
    })
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Guardar usuario'))
    expect(await screen.findByText(MENSAJES.correoYaRegistrado)).toBeInTheDocument()
    expect(ingresar('Correo institucional')).toHaveFocus()
    expect(ingresar('Correo institucional')).toHaveAttribute('aria-invalid', 'true')
    expect(boton('Guardar usuario')).not.toHaveAttribute('aria-busy')
  })

  it.each([
    [RESULTADO.sinPermiso, MENSAJES.sinPermiso],
    [RESULTADO.demasiadosIntentos, MENSAJES.demasiadosIntentos],
    [RESULTADO.errorServidor, MENSAJES.errorServidor],
    [RESULTADO.errorConexion, MENSAJES.errorConexion],
  ])('%s: muestra su mensaje y conserva lo escrito', async (tipo, mensaje) => {
    crearUsuario.mockResolvedValue({ tipo })
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Guardar usuario'))
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
    expect(ingresar('Nombre completo')).toHaveValue('Rosa Chávez')
    expect(ingresar('Nombre completo')).not.toHaveAttribute('readonly')
  })

  it('Cancelar vuelve al listado sin guardar', async () => {
    mostrar()
    await userEvent.click(boton('Cancelar'))
    expect(crearUsuario).not.toHaveBeenCalled()
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/usuarios')
  })

  it('solo con teclado: se recorre todo el formulario con Tab, se elige el rol y se envía con Enter', async () => {
    crearUsuario.mockResolvedValue(exito({ id: 9 }))
    mostrar()
    await userEvent.tab()
    expect(ingresar('Nombre completo')).toHaveFocus()
    await userEvent.keyboard('Rosa Chávez')
    await userEvent.tab()
    await userEvent.keyboard('rosa.chavez@upla.edu.pe')
    await userEvent.tab()
    expect(ingresar('Rol')).toHaveFocus()
    await userEvent.selectOptions(ingresar('Rol'), 'Responsable')
    await userEvent.tab()
    expect(screen.getByRole('switch')).toHaveFocus()
    await userEvent.tab()
    expect(ingresar('Contraseña inicial')).toHaveFocus()
    await userEvent.keyboard('Clave#123{Enter}')
    await waitFor(() => expect(crearUsuario).toHaveBeenCalledTimes(1))
  })
})

// ============================== Ambientes ==============================
describe('Registrar ambiente', () => {
  const mostrar = () =>
    renderEnRuta(<AmbienteFormPage />, {
      ruta: '/ambientes/nuevo',
      sesionInicial: SESIONES.administrador,
    })

  async function llenarValido() {
    await userEvent.type(ingresar('Nombre'), 'Auditorio Principal')
    await userEvent.selectOptions(ingresar('Tipo'), 'Auditorio')
    await userEvent.type(ingresar('Capacidad'), '200')
    await userEvent.type(ingresar('Ubicación'), 'Pabellón B, piso 1')
    await userEvent.selectOptions(ingresar('Estado'), 'Disponible')
  }

  it('muestra los seis campos del diseño y solo ofrece Responsables activos', async () => {
    mostrar()
    expect(screen.getByRole('heading', { name: 'Registrar ambiente' })).toBeInTheDocument()
    for (const etiqueta of ['Nombre', 'Tipo', 'Capacidad', 'Ubicación', 'Estado', 'Responsable']) {
      expect(ingresar(etiqueta)).toBeInTheDocument()
    }
    await screen.findByRole('option', { name: 'Mario Huamán' })
    expect(screen.queryByRole('option', { name: 'Rosa Chávez' })).not.toBeInTheDocument()
    expect(listarUsuarios).toHaveBeenCalledWith('Responsable')
  })

  it('campos vacíos: no envía y marca los cinco obligatorios (Responsable es opcional)', async () => {
    mostrar()
    await userEvent.click(boton('Guardar ambiente'))
    expect(crearAmbiente).not.toHaveBeenCalled()
    for (const mensaje of [
      MENSAJES.nombreAmbienteVacio,
      MENSAJES.tipoVacio,
      MENSAJES.capacidadVacia,
      MENSAJES.ubicacionVacia,
      MENSAJES.estadoAmbienteVacio,
    ]) {
      expect(screen.getByText(mensaje)).toBeInTheDocument()
    }
    expect(ingresar('Nombre')).toHaveFocus()
  })

  it.each([['abc'], ['12.5'], ['-3'], ['0']])(
    'capacidad inválida "%s": mensaje con ejemplo',
    async (valor) => {
      mostrar()
      await userEvent.type(ingresar('Capacidad'), valor)
      await userEvent.tab()
      expect(
        screen.getByText('Ingresa la capacidad como un número, por ejemplo 30.'),
      ).toBeInTheDocument()
    },
  )

  it('datos válidos: envía capacidad como número y responsable nulo', async () => {
    crearAmbiente.mockResolvedValue(exito({ id: 5 }))
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Guardar ambiente'))
    expect(crearAmbiente).toHaveBeenCalledWith(
      {
        nombre: 'Auditorio Principal',
        tipo: 'Auditorio',
        capacidad: 200,
        ubicacion: 'Pabellón B, piso 1',
        estado: 'Disponible',
        responsableId: null,
      },
      expect.any(Object),
    )
  })

  it('con responsable: envía su id como número', async () => {
    crearAmbiente.mockResolvedValue(exito({ id: 5 }))
    mostrar()
    await llenarValido()
    await userEvent.selectOptions(
      ingresar('Responsable'),
      await screen.findByRole('option', { name: 'Mario Huamán' }),
    )
    await userEvent.click(boton('Guardar ambiente'))
    expect(crearAmbiente.mock.calls[0][0].responsableId).toBe(3)
  })

  it('guardando: "Guardando…", campos bloqueados y sin doble envío', async () => {
    crearAmbiente.mockReturnValue(pendiente())
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Guardar ambiente'))
    expect(boton('Guardando…')).toBeInTheDocument()
    expect(ingresar('Tipo')).toBeDisabled()
    await userEvent.click(boton('Guardando…'))
    expect(crearAmbiente).toHaveBeenCalledTimes(1)
  })

  it('éxito: vuelve a Ambientes con el mensaje "Ambiente registrado."', async () => {
    crearAmbiente.mockResolvedValue(exito({ id: 5 }))
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Guardar ambiente'))
    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent('/ambientes'))
    expect(JSON.parse(screen.getByTestId('ubicacion').dataset.state)).toEqual({
      exito: MENSAJES.ambienteRegistrado,
    })
  })

  it('nombre repetido: el mensaje del servidor aparece bajo el nombre', async () => {
    crearAmbiente.mockResolvedValue({
      tipo: RESULTADO.datosInvalidos,
      errores: { nombre: MENSAJES.nombreAmbienteDuplicado },
    })
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Guardar ambiente'))
    expect(await screen.findByText(MENSAJES.nombreAmbienteDuplicado)).toBeInTheDocument()
    expect(ingresar('Nombre')).toHaveFocus()
  })

  it.each([
    [RESULTADO.sinPermiso, MENSAJES.sinPermiso],
    [RESULTADO.errorServidor, MENSAJES.errorServidor],
    [RESULTADO.errorConexion, MENSAJES.errorConexion],
  ])('%s: muestra su mensaje', async (tipo, mensaje) => {
    crearAmbiente.mockResolvedValue({ tipo })
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Guardar ambiente'))
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
  })

  it('si no se pudo cargar la lista de responsables lo avisa', async () => {
    listarUsuarios.mockResolvedValue({ tipo: RESULTADO.errorConexion })
    mostrar()
    expect(await screen.findByText(MENSAJES.errorConexion)).toBeInTheDocument()
  })

  it('Cancelar vuelve al listado', async () => {
    mostrar()
    await userEvent.click(boton('Cancelar'))
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/ambientes')
  })

  it('solo con teclado: Tab recorre los campos y Enter envía', async () => {
    crearAmbiente.mockResolvedValue(exito({ id: 5 }))
    mostrar()
    await userEvent.tab()
    expect(ingresar('Nombre')).toHaveFocus()
    await userEvent.keyboard('Auditorio Principal')
    await userEvent.tab()
    expect(ingresar('Tipo')).toHaveFocus()
    await userEvent.selectOptions(ingresar('Tipo'), 'Auditorio')
    await userEvent.tab()
    await userEvent.keyboard('200')
    await userEvent.tab()
    await userEvent.keyboard('Pabellón B')
    await userEvent.tab()
    expect(ingresar('Estado')).toHaveFocus()
    await userEvent.selectOptions(ingresar('Estado'), 'Disponible')
    await userEvent.tab()
    expect(ingresar('Responsable')).toHaveFocus()
    await userEvent.tab()
    expect(boton('Cancelar')).toHaveFocus()
    await userEvent.tab()
    expect(boton('Guardar ambiente')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(crearAmbiente).toHaveBeenCalledTimes(1))
  })
})

// ============================== Nueva reserva ==============================
describe('Nueva reserva', () => {
  const mostrar = (sesion = SESIONES.solicitante) =>
    renderEnRuta(<NuevaReservaPage />, { ruta: '/reservas/nueva', sesionInicial: sesion })

  const reservaCreada = {
    id: 7,
    ambienteNombre: 'Laboratorio de Cómputo 2',
    fecha: '2026-11-05',
    horaInicio: '10:00',
    horaFin: '12:00',
    estado: 'Pendiente',
  }

  async function llenarValido() {
    await userEvent.selectOptions(
      ingresar('Ambiente'),
      await screen.findByRole('option', { name: /Laboratorio de Cómputo 2/ }),
    )
    await userEvent.clear(ingresar('Fecha'))
    await userEvent.type(ingresar('Fecha'), '05112026')
    await userEvent.selectOptions(ingresar('Hora de inicio'), '10:00')
    await userEvent.selectOptions(ingresar('Hora de fin'), '12:00')
    await userEvent.type(ingresar('Motivo'), 'Práctica de programación')
  }

  it('muestra los campos del diseño, la fecha de hoy ya escrita y la ayuda del horario', async () => {
    mostrar()
    expect(screen.getByRole('heading', { name: 'Nueva reserva' })).toBeInTheDocument()
    expect(ingresar('Fecha')).toHaveValue(
      new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    )
    expect(screen.getByText('Horario permitido: 07:00 a 22:00')).toBeInTheDocument()
    await screen.findByRole('option', { name: /Laboratorio de Cómputo 2/ })
  })

  it('el ambiente se muestra con su capacidad y ubicación; el que está en mantenimiento no se puede elegir', async () => {
    mostrar()
    expect(
      await screen.findByRole('option', {
        name: 'Laboratorio de Cómputo 2 · 30 personas · Pabellón A, piso 2',
      }),
    ).toBeEnabled()
    expect(
      screen.getByRole('option', {
        name: 'Sala de Reuniones A · En mantenimiento (no disponible)',
      }),
    ).toBeDisabled()
  })

  it('campos vacíos: no envía y marca ambiente, horas y motivo; la fecha ya tiene valor', async () => {
    mostrar()
    await userEvent.click(boton('Registrar solicitud'))
    expect(crearReserva).not.toHaveBeenCalled()
    expect(screen.getByText(MENSAJES.ambienteVacio)).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.horaInicioVacia)).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.horaFinVacia)).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.motivoVacio)).toBeInTheDocument()
    expect(screen.queryByText(MENSAJES.fechaVacia)).not.toBeInTheDocument()
    expect(ingresar('Ambiente')).toHaveFocus()
  })

  it('fecha vacía o inexistente muestra su mensaje', async () => {
    mostrar()
    await userEvent.clear(ingresar('Fecha'))
    await userEvent.tab()
    expect(screen.getByText(MENSAJES.fechaVacia)).toBeInTheDocument()
    await userEvent.type(ingresar('Fecha'), '31022026')
    await userEvent.tab()
    expect(screen.getByText(MENSAJES.fechaFormatoInvalido)).toBeInTheDocument()
  })

  it('motivo de más de 300 caracteres muestra su mensaje', async () => {
    mostrar()
    await userEvent.click(ingresar('Motivo'))
    await userEvent.paste('a'.repeat(301))
    await userEvent.tab()
    expect(screen.getByText(MENSAJES.motivoDemasiadoLargo)).toBeInTheDocument()
  })

  it('RN-04: la hora de inicio solo ofrece de 07:00 a 22:00 cada 30 minutos', () => {
    mostrar()
    const horas = [...ingresar('Hora de inicio').querySelectorAll('option')]
      .map((o) => o.value)
      .filter(Boolean)
    expect(horas[0]).toBe('07:00')
    expect(horas.at(-1)).toBe('22:00')
    expect(horas).toHaveLength(31)
  })

  it('RN-03 (N1): la hora de fin solo ofrece horas posteriores a la de inicio', async () => {
    mostrar()
    await userEvent.selectOptions(ingresar('Hora de inicio'), '10:00')
    const opciones = [...ingresar('Hora de fin').querySelectorAll('option')]
      .map((o) => o.value)
      .filter(Boolean)
    expect(opciones[0]).toBe('10:30')
    expect(opciones).not.toContain('10:00')
    expect(opciones).not.toContain('09:30')
    expect(opciones.at(-1)).toBe('22:00')
  })

  it('si se adelanta la hora de inicio y la de fin deja de ser válida, la de fin se vacía', async () => {
    mostrar()
    await userEvent.selectOptions(ingresar('Hora de inicio'), '10:00')
    await userEvent.selectOptions(ingresar('Hora de fin'), '11:00')
    await userEvent.selectOptions(ingresar('Hora de inicio'), '12:00')
    expect(ingresar('Hora de fin')).toHaveValue('')
  })

  it('si la hora de fin sigue siendo válida al cambiar el inicio, se conserva', async () => {
    mostrar()
    await userEvent.selectOptions(ingresar('Hora de inicio'), '10:00')
    await userEvent.selectOptions(ingresar('Hora de fin'), '12:00')
    await userEvent.selectOptions(ingresar('Hora de inicio'), '09:00')
    expect(ingresar('Hora de fin')).toHaveValue('12:00')
  })

  it('datos válidos: envía la fecha en formato ISO, horas, motivo recortado y el id del ambiente', async () => {
    crearReserva.mockResolvedValue(exito(reservaCreada))
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar solicitud'))
    expect(crearReserva).toHaveBeenCalledWith(
      {
        ambienteId: 1,
        fecha: '2026-11-05',
        horaInicio: '10:00',
        horaFin: '12:00',
        motivo: 'Práctica de programación',
      },
      expect.any(Object),
    )
  })

  it('registrando: "Guardando…", campos bloqueados y sin doble envío', async () => {
    crearReserva.mockReturnValue(pendiente())
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar solicitud'))
    expect(boton('Guardando…')).toHaveAttribute('aria-busy', 'true')
    expect(ingresar('Hora de fin')).toBeDisabled()
    await userEvent.click(boton('Guardando…'))
    expect(crearReserva).toHaveBeenCalledTimes(1)
  })

  it('éxito (cierre): mensaje, resumen con ambiente, fecha, horario e insignia Pendiente', async () => {
    crearReserva.mockResolvedValue(exito(reservaCreada))
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar solicitud'))
    expect(await screen.findByText(MENSAJES.reservaRegistrada)).toBeInTheDocument()
    expect(screen.getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(screen.getByText('05/11/2026')).toBeInTheDocument()
    expect(screen.getByText('10:00 – 12:00')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('después del cierre, "Nueva reserva" vuelve a un formulario limpio', async () => {
    crearReserva.mockResolvedValue(exito(reservaCreada))
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar solicitud'))
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva reserva' }))
    expect(ingresar('Motivo')).toHaveValue('')
    expect(ingresar('Hora de inicio')).toHaveValue('')
  })

  it('error del servidor por campo se muestra bajo su campo', async () => {
    crearReserva.mockResolvedValue({
      tipo: RESULTADO.datosInvalidos,
      errores: { horaFin: MENSAJES.horaFinNoPosterior },
    })
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar solicitud'))
    expect(await screen.findByText(MENSAJES.horaFinNoPosterior)).toBeInTheDocument()
    expect(ingresar('Hora de fin')).toHaveFocus()
  })

  it.each([
    [RESULTADO.sinPermiso, MENSAJES.sinPermiso],
    [RESULTADO.demasiadosIntentos, MENSAJES.demasiadosIntentos],
    [RESULTADO.errorServidor, MENSAJES.errorServidor],
    [RESULTADO.errorConexion, MENSAJES.errorConexion],
  ])('%s: muestra su mensaje y conserva lo escrito', async (tipo, mensaje) => {
    crearReserva.mockResolvedValue({ tipo })
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar solicitud'))
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
    expect(ingresar('Motivo')).toHaveValue('Práctica de programación')
  })

  it('si no se pudo cargar la lista de ambientes lo avisa', async () => {
    listarAmbientes.mockResolvedValue({ tipo: RESULTADO.errorServidor })
    mostrar()
    expect(await screen.findByText(MENSAJES.errorServidor)).toBeInTheDocument()
  })

  it('Cancelar limpia el formulario', async () => {
    mostrar()
    await userEvent.type(ingresar('Motivo'), 'algo')
    await userEvent.click(boton('Cancelar'))
    expect(ingresar('Motivo')).toHaveValue('')
  })

  it('solo con teclado: Tab recorre los campos en orden y Enter envía', async () => {
    crearReserva.mockResolvedValue(exito(reservaCreada))
    mostrar()
    await screen.findByRole('option', { name: /Laboratorio de Cómputo 2/ })
    await userEvent.tab()
    expect(ingresar('Ambiente')).toHaveFocus()
    await userEvent.selectOptions(ingresar('Ambiente'), '1')
    await userEvent.tab()
    expect(ingresar('Fecha')).toHaveFocus()
    await userEvent.tab()
    expect(ingresar('Hora de inicio')).toHaveFocus()
    await userEvent.selectOptions(ingresar('Hora de inicio'), '10:00')
    await userEvent.tab()
    expect(ingresar('Hora de fin')).toHaveFocus()
    await userEvent.selectOptions(ingresar('Hora de fin'), '12:00')
    await userEvent.tab()
    expect(ingresar('Motivo')).toHaveFocus()
    await userEvent.keyboard('Práctica')
    await userEvent.tab()
    expect(boton('Cancelar')).toHaveFocus()
    await userEvent.tab()
    expect(boton('Registrar solicitud')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(crearReserva).toHaveBeenCalledTimes(1))
  })
})
