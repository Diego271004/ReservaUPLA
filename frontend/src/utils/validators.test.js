import { describe, expect, it } from 'vitest'
import { MENSAJES } from '../constants/messages.js'
import {
  normalizarCorreo,
  tieneErrores,
  validarAmbiente,
  validarAmbienteId,
  validarCapacidad,
  validarContrasenaInicial,
  validarContrasenaLogin,
  validarCorreo,
  validarEstadoAmbiente,
  validarFecha,
  validarHoraFin,
  validarHoraInicio,
  validarLogin,
  validarMotivo,
  validarNombreAmbiente,
  validarNombreCompleto,
  validarReserva,
  validarRol,
  validarTipo,
  validarUbicacion,
  validarUsuario,
} from './validators.js'

describe('validarCorreo', () => {
  it.each([
    ['', MENSAJES.correoVacio],
    ['   ', MENSAJES.correoVacio],
    ['ana.torres', MENSAJES.correoFormatoInvalido],
    ['ana@torres', MENSAJES.correoFormatoInvalido],
    ['ana torres@upla.edu.pe', MENSAJES.correoFormatoInvalido],
    ['ana@gmail.com', 'Usa tu correo institucional (termina en @upla.edu.pe).'],
    [`${'a'.repeat(250)}@upla.edu.pe`, MENSAJES.correoDemasiadoLargo],
  ])('"%s" → mensaje', (valor, mensaje) => expect(validarCorreo(valor)).toBe(mensaje))

  it('acepta un correo válido aunque tenga espacios y mayúsculas', () => {
    expect(validarCorreo('  Ana.Torres@UPLA.edu.pe ')).toBeNull()
  })

  it('usa el mensaje de vacío que se le indique', () => {
    expect(validarCorreo('', { mensajeVacio: MENSAJES.correoUsuarioVacio })).toBe(
      MENSAJES.correoUsuarioVacio,
    )
  })

  it('normalizarCorreo recorta y pasa a minúsculas', () => {
    expect(normalizarCorreo('  Ana@UPLA.edu.pe ')).toBe('ana@upla.edu.pe')
    expect(normalizarCorreo(undefined)).toBe('')
  })
})

describe('contraseñas', () => {
  it('login: vacía, larga y válida', () => {
    expect(validarContrasenaLogin('')).toBe(MENSAJES.contrasenaVacia)
    expect(validarContrasenaLogin('a'.repeat(129))).toBe(MENSAJES.contrasenaDemasiadoLarga)
    expect(validarContrasenaLogin('a'.repeat(128))).toBeNull()
    expect(validarContrasenaLogin('Clave#123')).toBeNull()
  })

  it('login: una contraseña de solo espacios no está vacía (los espacios cuentan)', () => {
    expect(validarContrasenaLogin('   ')).toBeNull()
  })

  it('inicial: vacía y demasiado larga (límite de BCrypt)', () => {
    expect(validarContrasenaInicial('')).toBe(MENSAJES.contrasenaInicialVacia)
    expect(validarContrasenaInicial('a'.repeat(72) + '1')).toBe(
      MENSAJES.contrasenaInicialDemasiadoLarga,
    )
    expect(validarContrasenaInicial('a'.repeat(71) + '1')).toBeNull()
  })

  it.each(['Ab1', 'Abcde1f', '12345678', 'abcdefgh', '!!!!!!!!'])(
    'inicial (U2): "%s" no cumple 8 a 72 caracteres con una letra y un número',
    (valor) => expect(validarContrasenaInicial(valor)).toBe(MENSAJES.contrasenaInicialRequisitos),
  )

  it.each(['Abcdefg1', '12345678a', 'clave segura 2026', 'Prueba#2026Upla'])(
    'inicial (U2): "%s" cumple la política',
    (valor) => expect(validarContrasenaInicial(valor)).toBeNull(),
  )
})

describe('campos del usuario', () => {
  it('nombre completo', () => {
    expect(validarNombreCompleto('  ')).toBe(MENSAJES.nombreCompletoVacio)
    expect(validarNombreCompleto('a'.repeat(121))).toBe(MENSAJES.nombreCompletoDemasiadoLargo)
    expect(validarNombreCompleto('Luis Quispe')).toBeNull()
  })

  it('rol: vacío, fuera de la lista y válido', () => {
    expect(validarRol('')).toBe(MENSAJES.rolVacio)
    expect(validarRol('Superusuario')).toBe(MENSAJES.rolInvalido)
    expect(validarRol('Responsable')).toBeNull()
  })
})

describe('campos del ambiente', () => {
  it('nombre', () => {
    expect(validarNombreAmbiente('')).toBe(MENSAJES.nombreAmbienteVacio)
    expect(validarNombreAmbiente('a'.repeat(121))).toBe(MENSAJES.nombreAmbienteDemasiadoLargo)
    expect(validarNombreAmbiente('Auditorio Principal')).toBeNull()
  })

  it('tipo y estado: vacío, fuera de la lista y válido', () => {
    expect(validarTipo('')).toBe(MENSAJES.tipoVacio)
    expect(validarTipo('Cancha')).toBe(MENSAJES.tipoInvalido)
    expect(validarTipo('Sala')).toBeNull()
    expect(validarEstadoAmbiente('')).toBe(MENSAJES.estadoAmbienteVacio)
    expect(validarEstadoAmbiente('Roto')).toBe(MENSAJES.estadoAmbienteInvalido)
    expect(validarEstadoAmbiente('En mantenimiento')).toBeNull()
  })

  it.each([
    ['', MENSAJES.capacidadVacia],
    ['abc', MENSAJES.capacidadInvalida],
    ['12.5', MENSAJES.capacidadInvalida],
    ['-3', MENSAJES.capacidadInvalida],
    ['0', MENSAJES.capacidadInvalida],
    ['5001', MENSAJES.capacidadInvalida],
    ['30', null],
    ['5000', null],
  ])('capacidad "%s"', (valor, mensaje) => expect(validarCapacidad(valor)).toBe(mensaje))

  it('ubicación', () => {
    expect(validarUbicacion('')).toBe(MENSAJES.ubicacionVacia)
    expect(validarUbicacion('a'.repeat(161))).toBe(MENSAJES.ubicacionDemasiadoLarga)
    expect(validarUbicacion('Pabellón A, piso 2')).toBeNull()
  })
})

describe('campos de la reserva', () => {
  it('ambiente', () => {
    expect(validarAmbienteId('')).toBe(MENSAJES.ambienteVacio)
    expect(validarAmbienteId('3')).toBeNull()
  })

  it.each([
    ['', MENSAJES.fechaVacia],
    ['2026-11-05', MENSAJES.fechaFormatoInvalido],
    ['31/02/2026', MENSAJES.fechaFormatoInvalido],
    ['05/11/2026', null],
  ])('fecha "%s"', (valor, mensaje) => expect(validarFecha(valor)).toBe(mensaje))

  it('hora de inicio: vacía, fuera de horario (RN-04) y válida', () => {
    expect(validarHoraInicio('')).toBe(MENSAJES.horaInicioVacia)
    expect(validarHoraInicio('06:30')).toBe(MENSAJES.horaFueraDeHorario)
    expect(validarHoraInicio('22:30')).toBe(MENSAJES.horaFueraDeHorario)
    expect(validarHoraInicio('10:15')).toBe(MENSAJES.horaFueraDeHorario) // no está en la lista cerrada
    expect(validarHoraInicio('07:00')).toBeNull()
  })

  it('hora de fin: vacía, fuera de horario y no posterior al inicio (RN-03)', () => {
    expect(validarHoraFin('', '10:00')).toBe(MENSAJES.horaFinVacia)
    expect(validarHoraFin('22:30', '10:00')).toBe(MENSAJES.horaFueraDeHorario)
    expect(validarHoraFin('10:00', '10:00')).toBe(MENSAJES.horaFinNoPosterior)
    expect(validarHoraFin('09:30', '10:00')).toBe(MENSAJES.horaFinNoPosterior)
    expect(validarHoraFin('10:30', '10:00')).toBeNull()
    expect(validarHoraFin('22:00', '07:00')).toBeNull()
  })

  it('hora de fin sin hora de inicio no inventa un error de orden', () => {
    expect(validarHoraFin('10:00', '')).toBeNull()
  })

  it('motivo', () => {
    expect(validarMotivo('  ')).toBe(MENSAJES.motivoVacio)
    expect(validarMotivo('a'.repeat(301))).toBe(MENSAJES.motivoDemasiadoLargo)
    expect(validarMotivo('Práctica de programación')).toBeNull()
  })
})

describe('validación de cada formulario completo', () => {
  it('login vacío da un error por campo y login válido ninguno', () => {
    const errores = validarLogin({ correo: '', contrasena: '' })
    expect(errores).toEqual({ correo: MENSAJES.correoVacio, contrasena: MENSAJES.contrasenaVacia })
    expect(tieneErrores(errores)).toBe(true)
    expect(tieneErrores(validarLogin({ correo: 'ana.torres@upla.edu.pe', contrasena: 'x' }))).toBe(
      false,
    )
  })

  it('usuario vacío da un error en cada campo obligatorio', () => {
    const errores = validarUsuario({ nombreCompleto: '', correo: '', rol: '', contrasena: '' })
    expect(Object.values(errores).filter(Boolean)).toHaveLength(4)
  })

  it('ambiente vacío da un error en cada campo obligatorio', () => {
    const errores = validarAmbiente({
      nombre: '',
      tipo: '',
      capacidad: '',
      ubicacion: '',
      estado: '',
    })
    expect(Object.values(errores).filter(Boolean)).toHaveLength(5)
  })

  it('reserva vacía da un error en cada campo obligatorio', () => {
    const errores = validarReserva({
      ambienteId: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      motivo: '',
    })
    expect(Object.values(errores).filter(Boolean)).toHaveLength(5)
  })
})
