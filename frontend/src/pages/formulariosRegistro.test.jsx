import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RESULTADO } from '../services/llamarApi.js'
import {
  consultarDisponibilidad,
  crearAmbiente,
  crearReserva,
  crearUsuario,
  listarAmbientes,
  listarUsuarios,
  obtenerDisponibilidadDia,
} from '../services/recursosService.js'
import { SESIONES, renderEnRuta } from '../test/utils.jsx'
import AmbienteFormPage from './AmbienteFormPage.jsx'
import NuevaReservaPage from './NuevaReservaPage.jsx'
import UsuarioFormPage from './UsuarioFormPage.jsx'

vi.mock('../services/recursosService.js', () => ({
  aprobarReserva: vi.fn(),
  cancelarReserva: vi.fn(),
  consultarDisponibilidad: vi.fn(),
  crearAmbiente: vi.fn(),
  crearReserva: vi.fn(),
  crearUsuario: vi.fn(),
  listarAmbientes: vi.fn(),
  listarUsuarios: vi.fn(),
  obtenerDisponibilidadDia: vi.fn(),
  obtenerReserva: vi.fn(),
  rechazarReserva: vi.fn(),
}))

const exito = (data) => ({ tipo: RESULTADO.exito, data })
const pendiente = () => new Promise(() => {})

beforeEach(() => {
  vi.resetAllMocks()
  obtenerDisponibilidadDia.mockResolvedValue(
    exito({ fecha: '2026-11-05', soloLectura: false, ambientes: [] }),
  )
  consultarDisponibilidad.mockResolvedValue(
    exito({ disponible: true, mensaje: MENSAJES.disponible }),
  )
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

  it('muestra el título, los campos del diseño, la ayuda del correo, el interruptor activo y los requisitos de la contraseña (U2)', () => {
    mostrar()
    expect(screen.getByRole('heading', { name: 'Registrar usuario' })).toBeInTheDocument()
    expect(ingresar('Correo institucional')).toHaveAccessibleDescription(
      'Ejemplo: nombre.apellido@upla.edu.pe',
    )
    expect(screen.getByRole('switch', { name: 'Activo' })).toBeChecked()
    expect(ingresar('Contraseña inicial')).toHaveAccessibleDescription(
      'Entre 8 y 72 caracteres, con al menos una letra y un número.',
    )
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
    await userEvent.click(boton('Registrar usuario'))
    expect(crearUsuario).not.toHaveBeenCalled()
    expect(screen.getByText(MENSAJES.nombreCompletoVacio)).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.correoUsuarioVacio)).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.rolVacio)).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.contrasenaInicialVacia)).toBeInTheDocument()
    expect(ingresar('Nombre completo')).toHaveFocus()
  })

  it('al enviar vacío, foco al primer error', async () => {
    mostrar()
    await userEvent.click(boton('Registrar usuario'))
    expect(crearUsuario).not.toHaveBeenCalled()
    expect(ingresar('Nombre completo')).toHaveFocus()
  })

  it('error al salir del campo (blur), antes de enviar', async () => {
    mostrar()
    await userEvent.type(ingresar('Correo institucional'), 'invalido')
    await userEvent.tab()
    expect(screen.getByText(MENSAJES.correoFormatoInvalido)).toBeInTheDocument()
    expect(crearUsuario).not.toHaveBeenCalled()
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

  it('U2: cuando la contraseña tiene error no se repite la ayuda con el mismo texto', async () => {
    mostrar()
    expect(screen.getByText(TEXTOS.ayudaContrasenaInicial)).toBeInTheDocument()
    await userEvent.type(ingresar('Contraseña inicial'), 'abcdefgh')
    await userEvent.tab()
    expect(screen.getByText(MENSAJES.contrasenaInicialRequisitos)).toBeInTheDocument()
    expect(screen.queryByText(TEXTOS.ayudaContrasenaInicial)).not.toBeInTheDocument()
  })

  it.each(['Ab1', '12345678', 'abcdefgh'])(
    'U2: la contraseña inicial "%s" no cumple los requisitos y lo dice bajo el campo',
    async (clave) => {
      mostrar()
      await userEvent.type(ingresar('Contraseña inicial'), clave)
      await userEvent.tab()
      expect(screen.getByText(MENSAJES.contrasenaInicialRequisitos)).toBeInTheDocument()
      expect(ingresar('Contraseña inicial')).toHaveAttribute('aria-invalid', 'true')
    },
  )

  it('U2: una contraseña inicial que cumple no muestra error y se envía', async () => {
    const usuario = userEvent.setup()
    crearUsuario.mockResolvedValue(exito({ id: 9 }))
    mostrar()
    await usuario.type(ingresar('Nombre completo'), 'Rosa Chávez')
    await usuario.type(ingresar('Correo institucional'), 'rosa.chavez@upla.edu.pe')
    await usuario.selectOptions(ingresar('Rol'), 'Responsable')
    await usuario.type(ingresar('Contraseña inicial'), 'Abcdefg1')
    await usuario.tab()
    expect(screen.queryByText(MENSAJES.contrasenaInicialRequisitos)).not.toBeInTheDocument()
    await usuario.click(boton('Registrar usuario'))
    await waitFor(() => expect(crearUsuario).toHaveBeenCalledTimes(1))
  })

  it('U2: si el backend rechaza la contraseña, su mensaje aparece bajo el campo', async () => {
    const usuario = userEvent.setup()
    crearUsuario.mockResolvedValue({
      tipo: RESULTADO.datosInvalidos,
      errores: { contrasena: MENSAJES.contrasenaInicialRequisitos },
    })
    mostrar()
    await usuario.type(ingresar('Nombre completo'), 'Rosa Chávez')
    await usuario.type(ingresar('Correo institucional'), 'rosa.chavez@upla.edu.pe')
    await usuario.selectOptions(ingresar('Rol'), 'Responsable')
    await usuario.type(ingresar('Contraseña inicial'), 'Clave#123')
    await usuario.click(boton('Registrar usuario'))
    expect(await screen.findByText(MENSAJES.contrasenaInicialRequisitos)).toBeInTheDocument()
    expect(ingresar('Contraseña inicial')).toHaveFocus()
  })

  it('campos válidos: sin errores y envía los datos normalizados', async () => {
    crearUsuario.mockResolvedValue(exito({ id: 9 }))
    mostrar()
    await userEvent.type(ingresar('Nombre completo'), '  Rosa Chávez ')
    await userEvent.type(ingresar('Correo institucional'), ' Rosa.Chavez@UPLA.edu.pe ')
    await userEvent.selectOptions(ingresar('Rol'), 'Responsable')
    await userEvent.click(screen.getByRole('switch', { name: 'Activo' }))
    await userEvent.type(ingresar('Contraseña inicial'), 'Clave#123')
    await userEvent.click(boton('Registrar usuario'))
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
    await userEvent.click(boton('Registrar usuario'))
    expect(boton('Guardando…')).toHaveAttribute('aria-busy', 'true')
    expect(ingresar('Nombre completo')).toHaveAttribute('readonly')
    expect(ingresar('Rol')).toBeDisabled()
    expect(boton('Volver')).toBeDisabled()
  })

  it('no permite un doble envío', async () => {
    crearUsuario.mockReturnValue(pendiente())
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar usuario'))
    await userEvent.click(boton('Guardando…'))
    expect(crearUsuario).toHaveBeenCalledTimes(1)
  })

  it('éxito: vuelve a Usuarios con el mensaje "Usuario registrado."', async () => {
    crearUsuario.mockResolvedValue(exito({ id: 9 }))
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar usuario'))
    await waitFor(() => {
      expect(screen.getByTestId('ubicacion')).toHaveTextContent('/usuarios')
      expect(JSON.parse(screen.getByTestId('ubicacion').dataset.state)).toEqual({
        exito: MENSAJES.usuarioRegistrado,
      })
    })
  })

  it('error del servidor por campo: "Ese correo ya está registrado." bajo el correo y con el foco', async () => {
    crearUsuario.mockResolvedValue({
      tipo: RESULTADO.datosInvalidos,
      errores: { correo: MENSAJES.correoYaRegistrado },
    })
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar usuario'))
    expect(await screen.findByText(MENSAJES.correoYaRegistrado)).toBeInTheDocument()
    expect(ingresar('Correo institucional')).toHaveFocus()
    expect(ingresar('Correo institucional')).toHaveAttribute('aria-invalid', 'true')
    expect(boton('Registrar usuario')).not.toHaveAttribute('aria-busy')
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
    await userEvent.click(boton('Registrar usuario'))
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
    expect(ingresar('Nombre completo')).toHaveValue('Rosa Chávez')
    expect(ingresar('Nombre completo')).not.toHaveAttribute('readonly')
  })

  it('Volver regresa al listado sin guardar', async () => {
    mostrar()
    await userEvent.click(boton('Volver'))
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
    await userEvent.click(boton('Registrar ambiente'))
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
    await userEvent.click(boton('Registrar ambiente'))
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
    await userEvent.click(boton('Registrar ambiente'))
    expect(crearAmbiente.mock.calls[0][0].responsableId).toBe(3)
  })

  it('guardando: "Guardando…", campos bloqueados y sin doble envío', async () => {
    const usuario = userEvent.setup()
    crearAmbiente.mockReturnValue(pendiente())
    mostrar()
    await usuario.type(ingresar('Nombre'), 'Auditorio Principal')
    await usuario.selectOptions(ingresar('Tipo'), 'Auditorio')
    await usuario.type(ingresar('Capacidad'), '200')
    await usuario.type(ingresar('Ubicación'), 'Pabellón B, piso 1')
    await usuario.selectOptions(ingresar('Estado'), 'Disponible')
    await usuario.click(boton('Registrar ambiente'))
    await waitFor(() => expect(boton('Guardando…')).toBeInTheDocument())
    expect(ingresar('Tipo')).toBeDisabled()
    await userEvent.click(boton('Guardando…'))
    expect(crearAmbiente).toHaveBeenCalledTimes(1)
  })

  it('éxito: vuelve a Ambientes con el mensaje "Ambiente registrado."', async () => {
    crearAmbiente.mockResolvedValue(exito({ id: 5 }))
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar ambiente'))
    await waitFor(() => {
      expect(screen.getByTestId('ubicacion')).toHaveTextContent('/ambientes')
      expect(JSON.parse(screen.getByTestId('ubicacion').dataset.state)).toEqual({
        exito: MENSAJES.ambienteRegistrado,
      })
    })
  })

  it('nombre repetido: el mensaje del servidor aparece bajo el nombre', async () => {
    crearAmbiente.mockResolvedValue({
      tipo: RESULTADO.datosInvalidos,
      errores: { nombre: MENSAJES.nombreAmbienteDuplicado },
    })
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar ambiente'))
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
    await userEvent.click(boton('Registrar ambiente'))
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
  })

  it('si no se pudo cargar la lista de responsables lo avisa', async () => {
    listarUsuarios.mockResolvedValue({ tipo: RESULTADO.errorConexion })
    mostrar()
    expect(await screen.findByText(MENSAJES.errorConexion)).toBeInTheDocument()
  })

  it('Volver regresa al listado', async () => {
    mostrar()
    await userEvent.click(boton('Volver'))
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
    expect(boton('Volver')).toHaveFocus()
    await userEvent.tab()
    expect(boton('Registrar ambiente')).toHaveFocus()
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

  async function llenarValido(usuario = userEvent) {
    await usuario.click(await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ }))
    await usuario.clear(ingresar('Fecha'))
    await usuario.type(ingresar('Fecha'), '05112030')
    await usuario.selectOptions(ingresar('Hora de inicio'), '10:00')
    await usuario.selectOptions(ingresar('Hora de fin'), '12:00')
    await usuario.type(ingresar('Motivo'), 'Práctica de programación')
  }

  it('la fecha dice en qué formato se escribe (el icono de calendario no abre ningún selector)', async () => {
    mostrar()
    expect(ingresar('Fecha')).toHaveAccessibleDescription(TEXTOS.ayudaFecha)
    expect(TEXTOS.ayudaFecha).toMatch(/dd\/mm\/aaaa/)
    await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ })
  })

  it('muestra los campos del diseño, la fecha de hoy ya escrita y la ayuda del horario', async () => {
    mostrar()
    expect(screen.getByRole('heading', { name: 'Nueva reserva' })).toBeInTheDocument()
    expect(ingresar('Fecha')).toHaveValue(
      new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    )
    expect(screen.getByText('Horario permitido: 07:00 a 22:00')).toBeInTheDocument()
    await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ })
  })

  it('las opciones del ambiente muestran solo el nombre; el que está en mantenimiento no se puede elegir', async () => {
    mostrar()
    const lab = await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    expect(lab).not.toHaveAttribute('aria-disabled')
    expect(within(lab).getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(within(lab).getByText('30 personas · Pabellón A, piso 2')).toBeInTheDocument()
    expect(within(lab).getByText('Disponible')).toBeInTheDocument()

    const mantenimiento = screen.getByRole('radio', { name: /Sala de Reuniones A/ })
    expect(mantenimiento).toHaveAttribute('aria-disabled', 'true')
    expect(within(mantenimiento).getByText('En mantenimiento (no disponible)')).toBeInTheDocument()
  })

  it('al elegir un ambiente con clic queda marcado con aria-checked="true"', async () => {
    mostrar()
    const lab = await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    expect(lab).toHaveAttribute('aria-checked', 'false')
    await userEvent.click(lab)
    expect(lab).toHaveAttribute('aria-checked', 'true')
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
    expect(screen.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })).toHaveFocus()
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
        fecha: '2030-11-05',
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

  it('RN-07: una fecha anterior a hoy se avisa junto al campo y no se envía', async () => {
    const usuario = userEvent.setup()
    mostrar()
    await llenarValido(usuario)
    await usuario.clear(ingresar('Fecha'))
    await usuario.type(ingresar('Fecha'), '01012020')
    await usuario.click(boton('Registrar solicitud'))
    expect(await screen.findByText(MENSAJES.fechaPasada)).toBeInTheDocument()
    expect(ingresar('Fecha')).toHaveAttribute('aria-invalid', 'true')
    expect(crearReserva).not.toHaveBeenCalled()
  })

  it('éxito (cierre): mensaje, resumen con ambiente, fecha, horario e insignia Pendiente', async () => {
    const usuario = userEvent.setup()
    crearReserva.mockResolvedValue(exito(reservaCreada))
    mostrar()
    await llenarValido(usuario)
    await usuario.click(boton('Registrar solicitud'))
    await waitFor(() => {
      expect(screen.getByText(MENSAJES.reservaRegistrada)).toBeInTheDocument()
    })
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
    await userEvent.click(await screen.findByRole('button', { name: 'Registrar otra solicitud' }))
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

  it('Limpiar formulario vacía los campos sin salir de la pantalla', async () => {
    mostrar()
    await userEvent.type(ingresar('Motivo'), 'algo')
    await userEvent.click(boton('Limpiar formulario'))
    expect(ingresar('Motivo')).toHaveValue('')
  })

  it('solo con teclado: Tab recorre los campos en orden y Enter envía', async () => {
    crearReserva.mockResolvedValue(exito(reservaCreada))
    mostrar()
    const lab = await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    await userEvent.tab()
    expect(lab).toHaveFocus()
    await userEvent.keyboard('{Space}')
    await userEvent.tab()
    expect(ingresar('Fecha')).toHaveFocus()
    await userEvent.tab()
    expect(ingresar('Hora de inicio')).toHaveFocus()
    await userEvent.selectOptions(ingresar('Hora de inicio'), '10:00')
    await userEvent.tab()
    expect(ingresar('Hora de fin')).toHaveFocus()
    await userEvent.selectOptions(ingresar('Hora de fin'), '12:00')
    for (const duracion of ['1 h', '2 h', '3 h']) {
      await userEvent.tab()
      expect(boton(duracion)).toHaveFocus()
    }
    await userEvent.tab()
    expect(ingresar('Motivo')).toHaveFocus()
    await userEvent.keyboard('Práctica')
    await userEvent.tab()
    expect(boton('Limpiar formulario')).toHaveFocus()
    await userEvent.tab()
    expect(boton('Registrar solicitud')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(crearReserva).toHaveBeenCalledTimes(1))
  })

  // ------------------------------------------------------------------ Fase 6: disponibilidad (04, 04e, 04f)

  const CONFLICTO =
    'Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00. Elige otro horario u otro ambiente.'

  async function elegirHorario(ambiente = '1', inicio = '10:00', fin = '12:00') {
    const radio = await screen.findByRole('radio', {
      name: ambiente === '1' ? /Laboratorio de Cómputo 2/ : /Sala de Reuniones A/,
    })
    await userEvent.click(radio)
    await userEvent.clear(ingresar('Fecha'))
    await userEvent.type(ingresar('Fecha'), '05112030')
    await userEvent.selectOptions(ingresar('Hora de inicio'), inicio)
    await userEvent.selectOptions(ingresar('Hora de fin'), fin)
  }

  it('04: con ambiente, fecha y horas completas consulta la disponibilidad y muestra el aviso verde', async () => {
    mostrar()
    await elegirHorario()
    const aviso = await screen.findByText(MENSAJES.disponible)
    expect(aviso.closest('[role="status"]')).toBeInTheDocument()
    expect(consultarDisponibilidad).toHaveBeenLastCalledWith({
      ambienteId: 1,
      fecha: '2030-11-05',
      horaInicio: '10:00',
      horaFin: '12:00',
    })
  })

  it('04e: si el ambiente está ocupado muestra el aviso rojo con la hora que dice el servidor', async () => {
    consultarDisponibilidad.mockResolvedValue(exito({ disponible: false, mensaje: CONFLICTO }))
    mostrar()
    await elegirHorario()
    const aviso = await screen.findByText(CONFLICTO)
    expect(aviso.closest('[role="alert"]')).toBeInTheDocument()
    expect(screen.queryByText(MENSAJES.disponible)).not.toBeInTheDocument()
  })

  it('el aviso de disponibilidad aparece junto a las horas, antes del motivo (no al final del formulario)', async () => {
    consultarDisponibilidad.mockResolvedValue(exito({ disponible: false, mensaje: CONFLICTO }))
    mostrar()
    await elegirHorario()
    const aviso = (await screen.findByText(CONFLICTO)).closest('[role="alert"]')
    const siguiente = Node.DOCUMENT_POSITION_FOLLOWING
    expect(ingresar('Hora de fin').compareDocumentPosition(aviso) & siguiente).toBeTruthy()
    expect(aviso.compareDocumentPosition(ingresar('Motivo')) & siguiente).toBeTruthy()
  })

  it('no consulta mientras falten datos (solo con el ambiente elegido)', async () => {
    mostrar()
    await userEvent.click(await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ }))
    await new Promise((resolver) => setTimeout(resolver, 450))
    expect(consultarDisponibilidad).not.toHaveBeenCalled()
  })

  it('no consulta si la hora de fin no es posterior (el error ya se ve en el formulario)', async () => {
    mostrar()
    await userEvent.click(await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ }))
    await userEvent.selectOptions(ingresar('Hora de inicio'), '10:00')
    await userEvent.selectOptions(ingresar('Hora de fin'), '10:30')
    await userEvent.selectOptions(ingresar('Hora de inicio'), '10:30') // el fin deja de ser válido y se vacía
    await new Promise((resolver) => setTimeout(resolver, 450))
    expect(consultarDisponibilidad).not.toHaveBeenCalled()
  })

  it('vuelve a consultar al cambiar un dato y reemplaza el aviso anterior', async () => {
    consultarDisponibilidad
      .mockResolvedValueOnce(exito({ disponible: false, mensaje: CONFLICTO }))
      .mockResolvedValueOnce(exito({ disponible: true, mensaje: MENSAJES.disponible }))
    mostrar()
    await elegirHorario()
    expect(await screen.findByText(CONFLICTO)).toBeInTheDocument()
    await userEvent.selectOptions(ingresar('Hora de inicio'), '13:00')
    await userEvent.selectOptions(ingresar('Hora de fin'), '14:00')
    expect(await screen.findByText(MENSAJES.disponible)).toBeInTheDocument()
    expect(screen.queryByText(CONFLICTO)).not.toBeInTheDocument()
  })

  it('mientras consulta muestra "Comprobando disponibilidad…"', async () => {
    consultarDisponibilidad.mockReturnValue(pendiente())
    mostrar()
    await elegirHorario()
    expect(await screen.findByText('Comprobando disponibilidad…')).toBeInTheDocument()
  })

  it('si la consulta falla (sin red) no muestra aviso ni impide registrar', async () => {
    consultarDisponibilidad.mockResolvedValue({ tipo: RESULTADO.errorConexion })
    crearReserva.mockResolvedValue(exito(reservaCreada))
    mostrar()
    await llenarValido()
    await waitFor(() => expect(consultarDisponibilidad).toHaveBeenCalled())
    expect(screen.queryByText(MENSAJES.disponible)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await userEvent.click(boton('Registrar solicitud'))
    expect(crearReserva).toHaveBeenCalledTimes(1)
  })

  it('RN-01: aunque el aviso diga ocupado, registrar deja decidir al servidor y un 409 muestra su mensaje', async () => {
    consultarDisponibilidad.mockResolvedValue(exito({ disponible: false, mensaje: CONFLICTO }))
    crearReserva.mockResolvedValue({ tipo: RESULTADO.conflicto, mensaje: CONFLICTO })
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar solicitud'))
    await waitFor(() => expect(crearReserva).toHaveBeenCalledTimes(1))
    expect((await screen.findAllByText(CONFLICTO)).length).toBeGreaterThan(0)
    expect(ingresar('Motivo')).toHaveValue('Práctica de programación')
    expect(boton('Registrar solicitud')).not.toHaveAttribute('aria-busy')
  })

  it('04f: el error del servidor sobre el ambiente en mantenimiento aparece bajo el campo Ambiente', async () => {
    crearReserva.mockResolvedValue({
      tipo: RESULTADO.datosInvalidos,
      errores: { ambienteId: MENSAJES.ambienteEnMantenimiento },
    })
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar solicitud'))
    expect(await screen.findByText(MENSAJES.ambienteEnMantenimiento)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })).toHaveFocus()
  })

  describe('resumen vivo, atajos de duración y contador', () => {
    const resumen = () => screen.getByRole('complementary', { name: 'Resumen de tu solicitud' })

    it('el resumen empieza con «Sin elegir» y con la fecha de hoy en letras', async () => {
      mostrar()
      await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ })
      expect(within(resumen()).getAllByText('Sin elegir')).toHaveLength(3)
      expect(
        within(resumen()).getByText(/^[a-záéíóúñ]+, \d{1,2} de [a-záéíóúñ]+ de \d{4}$/i),
      ).toBeInTheDocument()
      expect(within(resumen()).getByText(/Pendiente/)).toBeInTheDocument()
    })

    it('lo que se elige aparece en el resumen al instante, con la duración', async () => {
      mostrar()
      await userEvent.click(await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ }))
      await userEvent.selectOptions(ingresar('Hora de inicio'), '10:00')
      await userEvent.selectOptions(ingresar('Hora de fin'), '12:30')
      await userEvent.type(ingresar('Motivo'), 'Práctica de programación')
      const panel = within(resumen())
      expect(panel.getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
      expect(panel.getByText('30 personas · Pabellón A, piso 2')).toBeInTheDocument()
      expect(panel.getByText('10:00 – 12:30')).toBeInTheDocument()
      expect(panel.getByText('2 h 30 min')).toBeInTheDocument()
      expect(panel.getByText('Práctica de programación')).toBeInTheDocument()
      expect(panel.queryByText('Sin elegir')).not.toBeInTheDocument()
    })

    it('el resumen cambia al cambiar ambiente/fecha/horario', async () => {
      mostrar()
      const radio = await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ })
      await userEvent.click(radio)
      const inputFecha = ingresar('Fecha')
      await userEvent.clear(inputFecha)
      await userEvent.type(inputFecha, '20112026')
      await userEvent.selectOptions(ingresar('Hora de inicio'), '10:00')
      await userEvent.selectOptions(ingresar('Hora de fin'), '12:00')
      const panel = within(resumen())
      expect(panel.getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
      expect(panel.getByText(/20 de noviembre de 2026/i)).toBeInTheDocument()
      expect(panel.getByText('10:00 – 12:00')).toBeInTheDocument()
      expect(panel.getByText('2 h')).toBeInTheDocument()
    })

    it('el resumen se anuncia con aria-live="polite" y es solo lectura', async () => {
      mostrar()
      await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ })
      expect(resumen().querySelector('dl')).toHaveAttribute('aria-live', 'polite')
      expect(within(resumen()).queryByRole('button')).not.toBeInTheDocument()
    })

    it('sin hora de inicio los atajos están desactivados y dicen por qué', async () => {
      mostrar()
      await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ })
      for (const duracion of ['1 h', '2 h', '3 h']) {
        expect(boton(duracion)).toBeDisabled()
        expect(boton(duracion)).toHaveAttribute('title', 'Elige primero la hora de inicio')
      }
    })

    it('un atajo completa la hora de fin, queda presionado y el resumen lo refleja', async () => {
      mostrar()
      await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ })
      await userEvent.selectOptions(ingresar('Hora de inicio'), '10:00')
      expect(boton('2 h')).toHaveAttribute('aria-pressed', 'false')
      await userEvent.click(boton('2 h'))
      expect(ingresar('Hora de fin')).toHaveValue('12:00')
      expect(boton('2 h')).toHaveAttribute('aria-pressed', 'true')
      expect(within(resumen()).getByText('2 h')).toBeInTheDocument()
      await userEvent.click(boton('3 h'))
      expect(ingresar('Hora de fin')).toHaveValue('13:00')
      expect(boton('3 h')).toHaveAttribute('aria-pressed', 'true')
      expect(boton('2 h')).toHaveAttribute('aria-pressed', 'false')
    })

    it('un atajo que pasaría de las 22:00 se desactiva y dice por qué; el de 1 h sí sirve', async () => {
      mostrar()
      await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ })
      await userEvent.selectOptions(ingresar('Hora de inicio'), '21:00')
      expect(boton('2 h')).toBeDisabled()
      expect(boton('2 h')).toHaveAttribute('title', 'Pasaría de las 22:00')
      expect(boton('3 h')).toBeDisabled()
      await userEvent.click(boton('1 h'))
      expect(ingresar('Hora de fin')).toHaveValue('22:00')
    })

    it('el motivo cuenta los caracteres (de 300) y el contador forma parte de su descripción', async () => {
      mostrar()
      await screen.findByRole('radio', { name: /Laboratorio de Cómputo 2/ })
      expect(ingresar('Motivo')).toHaveAccessibleDescription('0 de 300 caracteres')
      await userEvent.type(ingresar('Motivo'), 'Clase')
      expect(ingresar('Motivo')).toHaveAccessibleDescription('5 de 300 caracteres')
    })
  })

  it('04c: el cierre ofrece "Ver detalle", que lleva a la reserva recién creada', async () => {
    crearReserva.mockResolvedValue(exito(reservaCreada))
    mostrar()
    await llenarValido()
    await userEvent.click(boton('Registrar solicitud'))
    await userEvent.click(await screen.findByRole('button', { name: 'Ver detalle' }))
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/reservas/7')
    // Quien acaba de registrar su solicitud vuelve a su lista de Reservas, no a Inicio.
    expect(JSON.parse(screen.getByTestId('ubicacion').dataset.state)).toEqual({
      volverA: '/reservas',
    })
  })
})
