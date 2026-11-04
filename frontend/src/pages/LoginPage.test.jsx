import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MENSAJES, TEXTOS } from '../constants/messages.js'
import { RESULTADO } from '../services/llamarApi.js'
import { SESIONES, renderEnRuta } from '../test/utils.jsx'
import { login } from '../services/authService.js'
import LoginPage from './LoginPage.jsx'

vi.mock('../services/authService.js', () => ({ login: vi.fn() }))

const CORREO = 'ana.torres@upla.edu.pe'
const CLAVE = 'Clave#123'

const mostrar = (opciones) => renderEnRuta(<LoginPage />, { ruta: '/login', ...opciones })
const campoCorreo = () => screen.getByLabelText('Correo institucional')
const campoClave = () => screen.getByLabelText('Contraseña')
const botonIngresar = () => screen.getByRole('button', { name: /Ingresar|Verificando/ })

async function llenar(correo = CORREO, clave = CLAVE) {
  if (correo) await userEvent.type(campoCorreo(), correo)
  if (clave) await userEvent.type(campoClave(), clave)
}

// Una petición que queda pendiente hasta que la prueba la resuelva (estado de carga).
function peticionPendiente() {
  let resolver
  const promesa = new Promise((resolverPromesa) => {
    resolver = resolverPromesa
  })
  login.mockImplementation((_c, _p, { signal }) => {
    signal.addEventListener('abort', () => resolver({ tipo: RESULTADO.cancelado }))
    return promesa
  })
  return resolver
}

beforeEach(() => {
  login.mockReset()
})

describe('Login: contenido', () => {
  it('muestra la marca, el lema, la universidad, la ayuda del correo y el enlace de ayuda', () => {
    mostrar()
    expect(screen.getByText('ReservaUPLA')).toBeInTheDocument()
    expect(screen.getByText(TEXTOS.lemaLogin)).toBeInTheDocument()
    expect(screen.getByText('Universidad Peruana Los Andes')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(campoCorreo()).toHaveAccessibleDescription('Ejemplo: nombre.apellido@upla.edu.pe')
    expect(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' })).toBeInTheDocument()
  })

  it('el panel agrupa la marca y el lema arriba, como en el diseño; la universidad va aparte, abajo', () => {
    mostrar()
    const encabezado = screen.getByTestId('encabezado-panel')
    expect(encabezado).toContainElement(screen.getByText('ReservaUPLA'))
    expect(encabezado).toContainElement(screen.getByText(TEXTOS.lemaLogin))
    expect(encabezado).not.toContainElement(screen.getByText('Universidad Peruana Los Andes'))
  })

  it('no tiene logotipo, notificaciones ni enlaces que no estén en el diseño', () => {
    mostrar()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(
      screen.queryByText(/notificaciones|tiempo real|términos|privacidad/i),
    ).not.toBeInTheDocument()
  })
})

describe('Login: campo correo (vacío, inválido, válido)', () => {
  it('vacío: al salir del campo muestra "Ingresa tu correo institucional."', async () => {
    mostrar()
    await userEvent.click(campoCorreo())
    await userEvent.tab()
    expect(screen.getByText(MENSAJES.correoVacio)).toBeInTheDocument()
    expect(campoCorreo()).toHaveAttribute('aria-invalid', 'true')
  })

  it('inválido: formato y dominio', async () => {
    mostrar()
    await userEvent.type(campoCorreo(), 'ana.torres')
    await userEvent.tab()
    expect(screen.getByText(MENSAJES.correoFormatoInvalido)).toBeInTheDocument()

    await userEvent.clear(campoCorreo())
    await userEvent.type(campoCorreo(), 'ana@gmail.com')
    await userEvent.tab()
    expect(
      screen.getByText('Usa tu correo institucional (termina en @upla.edu.pe).'),
    ).toBeInTheDocument()
  })

  it('válido: no muestra error', async () => {
    mostrar()
    await userEvent.type(campoCorreo(), CORREO)
    await userEvent.tab()
    expect(campoCorreo()).not.toHaveAttribute('aria-invalid')
  })

  it('el error visible desaparece apenas se corrige, sin esperar a salir del campo', async () => {
    mostrar()
    await userEvent.click(campoCorreo())
    await userEvent.tab()
    await userEvent.click(campoCorreo())
    await userEvent.type(campoCorreo(), CORREO)
    expect(screen.queryByText(MENSAJES.correoVacio)).not.toBeInTheDocument()
  })

  it('un error nuevo no aparece con la primera tecla (solo al salir o enviar)', async () => {
    mostrar()
    await userEvent.type(campoCorreo(), 'a')
    expect(screen.queryByText(MENSAJES.correoFormatoInvalido)).not.toBeInTheDocument()
  })
})

describe('Login: campo contraseña (vacío, inválido, válido) y mostrar/ocultar', () => {
  it('vacío: al salir muestra "Ingresa tu contraseña."', async () => {
    mostrar()
    await userEvent.click(campoClave())
    await userEvent.tab()
    expect(screen.getByText(MENSAJES.contrasenaVacia)).toBeInTheDocument()
  })

  it('inválido: más de 128 caracteres', async () => {
    mostrar()
    await userEvent.click(campoClave())
    await userEvent.paste('a'.repeat(129))
    await userEvent.tab()
    expect(screen.getByText(MENSAJES.contrasenaDemasiadoLarga)).toBeInTheDocument()
  })

  it('válida: no muestra error', async () => {
    mostrar()
    await userEvent.type(campoClave(), CLAVE)
    await userEvent.tab()
    expect(campoClave()).not.toHaveAttribute('aria-invalid')
  })

  it('Mostrar / Ocultar cambia el tipo del campo y el texto del botón', async () => {
    mostrar()
    expect(campoClave()).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(campoClave()).toHaveAttribute('type', 'text')
    await userEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(campoClave()).toHaveAttribute('type', 'password')
  })
})

describe('Login: aviso de Bloq Mayús', () => {
  it('aparece con Bloq Mayús activo al escribir y desaparece al salir del campo', async () => {
    mostrar()
    await userEvent.click(campoClave())
    fireEvent.keyDown(campoClave(), { key: 'a', modifierCapsLock: true })
    expect(screen.getByText(TEXTOS.avisoBloqMayus)).toBeInTheDocument()
    await userEvent.tab()
    expect(screen.queryByText(TEXTOS.avisoBloqMayus)).not.toBeInTheDocument()
  })

  it('desaparece cuando se desactiva Bloq Mayús', async () => {
    mostrar()
    await userEvent.click(campoClave())
    fireEvent.keyDown(campoClave(), { key: 'a', modifierCapsLock: true })
    fireEvent.keyUp(campoClave(), { key: 'CapsLock', modifierCapsLock: false })
    expect(screen.queryByText(TEXTOS.avisoBloqMayus)).not.toBeInTheDocument()
  })

  it('avisa también si se entra al campo con un clic y el bloqueo ya está activo', () => {
    mostrar()
    fireEvent.mouseDown(campoClave(), { modifierCapsLock: true })
    expect(screen.getByText(TEXTOS.avisoBloqMayus)).toBeInTheDocument()
  })

  it('sin Bloq Mayús no muestra el aviso', async () => {
    mostrar()
    await userEvent.type(campoClave(), 'a')
    expect(screen.queryByText(TEXTOS.avisoBloqMayus)).not.toBeInTheDocument()
  })
})

describe('Login: enlace de ayuda (soporte)', () => {
  it('abrir y cerrar muestra el mensaje de Soporte TI sin inventar correo ni teléfono', async () => {
    mostrar()
    const enlace = screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' })
    expect(enlace).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(enlace)
    expect(screen.getByText('Comunícate con Soporte TI de la universidad')).toBeInTheDocument()
    expect(screen.getByText('Comunícate con Soporte TI de la universidad').textContent).not.toMatch(
      /@|anexo|\d{6,}/,
    )
    await userEvent.click(enlace)
    expect(
      screen.queryByText('Comunícate con Soporte TI de la universidad'),
    ).not.toBeInTheDocument()
  })
})

describe('Login: botón Ingresar (habilitado, carga) y envío', () => {
  it('con errores no envía, muestra los dos mensajes y enfoca el primer campo con error', async () => {
    mostrar()
    await userEvent.click(botonIngresar())
    expect(login).not.toHaveBeenCalled()
    expect(screen.getByText(MENSAJES.correoVacio)).toBeInTheDocument()
    expect(screen.getByText(MENSAJES.contrasenaVacia)).toBeInTheDocument()
    expect(campoCorreo()).toHaveFocus()
  })

  it('solo la contraseña vacía: enfoca la contraseña', async () => {
    mostrar()
    await llenar(CORREO, '')
    await userEvent.click(botonIngresar())
    expect(campoClave()).toHaveFocus()
  })

  it('envía el correo normalizado y la contraseña tal cual', async () => {
    login.mockResolvedValue({ tipo: RESULTADO.exito, data: { ...SESIONES.solicitante } })
    mostrar()
    await llenar('  Ana.Torres@UPLA.edu.pe ', ' Clave#123 ')
    await userEvent.click(botonIngresar())
    expect(login).toHaveBeenCalledWith(
      CORREO,
      ' Clave#123 ',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('carga: el botón dice "Verificando credenciales…", los campos quedan de solo lectura y aparece Cancelar', async () => {
    peticionPendiente()
    mostrar()
    await llenar()
    await userEvent.click(botonIngresar())
    const boton = screen.getByRole('button', { name: TEXTOS.verificandoCredenciales })
    expect(boton).toHaveAttribute('aria-busy', 'true')
    expect(campoCorreo()).toHaveAttribute('readonly')
    expect(campoClave()).toHaveAttribute('readonly')
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('no permite un doble envío mientras carga', async () => {
    peticionPendiente()
    mostrar()
    await llenar()
    await userEvent.click(botonIngresar())
    await userEvent.click(screen.getByRole('button', { name: TEXTOS.verificandoCredenciales }))
    await userEvent.type(campoClave(), '{Enter}')
    expect(login).toHaveBeenCalledTimes(1)
  })

  it('Cancelar aborta la petición, vuelve al formulario con los datos y sin mensaje de error', async () => {
    peticionPendiente()
    mostrar()
    await llenar()
    await userEvent.click(botonIngresar())
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument(),
    )
    expect(campoCorreo()).toHaveValue(CORREO)
    expect(campoCorreo()).not.toHaveAttribute('readonly')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })
})

describe('Login: mensajes de éxito y de error', () => {
  it('éxito: guarda la sesión en sessionStorage y va a la pantalla inicial del rol', async () => {
    login.mockResolvedValue({ tipo: RESULTADO.exito, data: { ...SESIONES.solicitante } })
    mostrar()
    await llenar()
    await userEvent.click(botonIngresar())
    await waitFor(() =>
      expect(screen.getByTestId('ubicacion')).toHaveTextContent('/reservas/nueva'),
    )
    expect(JSON.parse(sessionStorage.getItem('reservaupla.sesion')).token).toBe(
      SESIONES.solicitante.token,
    )
    expect(localStorage.length).toBe(0)
  })

  it.each([
    ['Administrador', '/ambientes'],
    ['Responsable', '/mi-ambiente'],
  ])('el rol %s va a %s', async (rol, ruta) => {
    login.mockResolvedValue({ tipo: RESULTADO.exito, data: { ...SESIONES.administrador, rol } })
    mostrar()
    await llenar()
    await userEvent.click(botonIngresar())
    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent(ruta))
  })

  it('credenciales inválidas: mensaje genérico, conserva el correo, limpia la contraseña y la enfoca', async () => {
    login.mockResolvedValue({ tipo: 'credencialesInvalidas' })
    mostrar()
    await llenar()
    await userEvent.click(botonIngresar())
    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAJES.credencialesInvalidas)
    expect(campoCorreo()).toHaveValue(CORREO)
    expect(campoClave()).toHaveValue('')
    expect(campoClave()).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Ingresar' })).not.toHaveAttribute('aria-busy')
  })

  it('errores del servidor por campo (400) se muestran bajo su campo y enfocan el primero', async () => {
    login.mockResolvedValue({
      tipo: RESULTADO.datosInvalidos,
      errores: { correo: 'Mensaje del servidor para el correo.' },
    })
    mostrar()
    await llenar()
    await userEvent.click(botonIngresar())
    expect(await screen.findByText('Mensaje del servidor para el correo.')).toBeInTheDocument()
    expect(campoCorreo()).toHaveFocus()
  })

  it.each([
    [RESULTADO.demasiadosIntentos, MENSAJES.demasiadosIntentos],
    [RESULTADO.errorServidor, MENSAJES.errorServidor],
    [RESULTADO.errorConexion, MENSAJES.errorConexion],
  ])('%s: muestra su mensaje, libera el formulario y conserva los datos', async (tipo, mensaje) => {
    login.mockResolvedValue({ tipo })
    mostrar()
    await llenar()
    await userEvent.click(botonIngresar())
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
    expect(campoCorreo()).toHaveValue(CORREO)
    expect(campoClave()).toHaveValue(CLAVE)
    expect(campoCorreo()).not.toHaveAttribute('readonly')
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
  })

  it('un nuevo intento limpia el mensaje de error anterior', async () => {
    login.mockResolvedValueOnce({ tipo: RESULTADO.errorServidor })
    login.mockImplementationOnce(() => new Promise(() => {}))
    mostrar()
    await llenar()
    await userEvent.click(botonIngresar())
    await screen.findByRole('alert')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Login: solo con teclado', () => {
  it('el orden de Tab es correo, contraseña, Mostrar, Ingresar y ayuda; Enter envía', async () => {
    login.mockResolvedValue({ tipo: 'credencialesInvalidas' })
    mostrar()
    await userEvent.tab()
    expect(campoCorreo()).toHaveFocus()
    await userEvent.keyboard(CORREO)
    await userEvent.tab()
    expect(campoClave()).toHaveFocus()
    await userEvent.keyboard(CLAVE)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' })).toHaveFocus()

    await userEvent.tab({ shift: true })
    await userEvent.tab({ shift: true })
    await userEvent.tab({ shift: true })
    expect(campoClave()).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(login).toHaveBeenCalledTimes(1)
  })

  it('el foco se ve: los controles reciben foco con Tab (la regla :focus-visible de 3 px está en global.css)', async () => {
    mostrar()
    await userEvent.tab()
    expect(document.activeElement).toBe(campoCorreo())
  })
})

describe('Login: sesión', () => {
  it('quien ya tiene sesión va directo a su pantalla inicial', () => {
    mostrar({ sesionInicial: SESIONES.administrador })
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/ambientes')
  })
})
