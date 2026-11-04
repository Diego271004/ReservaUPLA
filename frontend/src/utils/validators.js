// Funciones puras de validación: devuelven el mensaje del primer error o null. Reflejan las reglas
// del backend (Application/Validators); el frontend ayuda al usuario y el backend decide.
import {
  DOMINIO_INSTITUCIONAL,
  MENSAJES,
  mensajeDominioNoInstitucional,
} from '../constants/messages.js'
import { OPCIONES_ESTADO_AMBIENTE, OPCIONES_ROL, OPCIONES_TIPO } from '../constants/navegacion.js'
import { HORAS, HORA_APERTURA, HORA_CIERRE, minutosDeHora, parsearFecha } from './fechas.js'

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CAPACIDAD_MAXIMA = 5000

export const LIMITES = Object.freeze({
  correo: 254,
  contrasenaLogin: 128,
  contrasenaInicial: 72,
  nombreCompleto: 120,
  nombreAmbiente: 120,
  ubicacion: 160,
  motivo: 300,
})

export const normalizarCorreo = (correo) => (correo ?? '').trim().toLowerCase()

const vacio = (valor) => (valor ?? '').trim() === ''
const esUnoDe = (opciones, valor) => opciones.some((opcion) => opcion.valor === valor)

export function validarCorreo(
  valor,
  { mensajeVacio = MENSAJES.correoVacio, dominio = DOMINIO_INSTITUCIONAL } = {},
) {
  const correo = normalizarCorreo(valor)
  if (correo === '') return mensajeVacio
  if (correo.length > LIMITES.correo) return MENSAJES.correoDemasiadoLargo
  if (!FORMATO_CORREO.test(correo)) return MENSAJES.correoFormatoInvalido
  if (!correo.endsWith(`@${dominio}`)) return mensajeDominioNoInstitucional(dominio)
  return null
}

// La contraseña no se recorta: los espacios forman parte de ella.
export function validarContrasenaLogin(valor) {
  if ((valor ?? '') === '') return MENSAJES.contrasenaVacia
  if (valor.length > LIMITES.contrasenaLogin) return MENSAJES.contrasenaDemasiadoLarga
  return null
}

// Sin reglas de complejidad: la política de la contraseña inicial queda pendiente (hallazgo U2).
export function validarContrasenaInicial(valor) {
  if ((valor ?? '') === '') return MENSAJES.contrasenaInicialVacia
  if (valor.length > LIMITES.contrasenaInicial) return MENSAJES.contrasenaInicialDemasiadoLarga
  return null
}

export function validarNombreCompleto(valor) {
  if (vacio(valor)) return MENSAJES.nombreCompletoVacio
  if (valor.trim().length > LIMITES.nombreCompleto) return MENSAJES.nombreCompletoDemasiadoLargo
  return null
}

export function validarRol(valor) {
  if (vacio(valor)) return MENSAJES.rolVacio
  return esUnoDe(OPCIONES_ROL, valor) ? null : MENSAJES.rolInvalido
}

export function validarNombreAmbiente(valor) {
  if (vacio(valor)) return MENSAJES.nombreAmbienteVacio
  if (valor.trim().length > LIMITES.nombreAmbiente) return MENSAJES.nombreAmbienteDemasiadoLargo
  return null
}

export function validarTipo(valor) {
  if (vacio(valor)) return MENSAJES.tipoVacio
  return esUnoDe(OPCIONES_TIPO, valor) ? null : MENSAJES.tipoInvalido
}

export function validarCapacidad(valor) {
  const texto = (valor ?? '').trim()
  if (texto === '') return MENSAJES.capacidadVacia
  if (!/^\d+$/.test(texto)) return MENSAJES.capacidadInvalida
  const capacidad = Number(texto)
  return capacidad >= 1 && capacidad <= CAPACIDAD_MAXIMA ? null : MENSAJES.capacidadInvalida
}

export function validarUbicacion(valor) {
  if (vacio(valor)) return MENSAJES.ubicacionVacia
  if (valor.trim().length > LIMITES.ubicacion) return MENSAJES.ubicacionDemasiadoLarga
  return null
}

export function validarEstadoAmbiente(valor) {
  if (vacio(valor)) return MENSAJES.estadoAmbienteVacio
  return esUnoDe(OPCIONES_ESTADO_AMBIENTE, valor) ? null : MENSAJES.estadoAmbienteInvalido
}

export function validarAmbienteId(valor) {
  return vacio(String(valor ?? '')) ? MENSAJES.ambienteVacio : null
}

export function validarFecha(valor) {
  if (vacio(valor)) return MENSAJES.fechaVacia
  return parsearFecha(valor) ? null : MENSAJES.fechaFormatoInvalido
}

const dentroDelHorario = (hora) =>
  minutosDeHora(hora) >= minutosDeHora(HORA_APERTURA) &&
  minutosDeHora(hora) <= minutosDeHora(HORA_CIERRE)

export function validarHoraInicio(valor) {
  if (vacio(valor) || minutosDeHora(valor) === null) return MENSAJES.horaInicioVacia
  return dentroDelHorario(valor) && HORAS.includes(valor) ? null : MENSAJES.horaFueraDeHorario
}

export function validarHoraFin(valor, horaInicio) {
  if (vacio(valor) || minutosDeHora(valor) === null) return MENSAJES.horaFinVacia
  if (!dentroDelHorario(valor) || !HORAS.includes(valor)) return MENSAJES.horaFueraDeHorario
  const inicio = minutosDeHora(horaInicio)
  // Si el inicio no es válido, su error ya se muestra en su propio campo.
  return inicio !== null && minutosDeHora(valor) <= inicio ? MENSAJES.horaFinNoPosterior : null
}

export function validarMotivo(valor) {
  if (vacio(valor)) return MENSAJES.motivoVacio
  if (valor.trim().length > LIMITES.motivo) return MENSAJES.motivoDemasiadoLargo
  return null
}

export const tieneErrores = (errores) => Object.values(errores).some(Boolean)

export const validarLogin = ({ correo, contrasena }) => ({
  correo: validarCorreo(correo),
  contrasena: validarContrasenaLogin(contrasena),
})

export const validarUsuario = ({ nombreCompleto, correo, rol, contrasena }) => ({
  nombreCompleto: validarNombreCompleto(nombreCompleto),
  correo: validarCorreo(correo, { mensajeVacio: MENSAJES.correoUsuarioVacio }),
  rol: validarRol(rol),
  contrasena: validarContrasenaInicial(contrasena),
})

export const validarAmbiente = ({ nombre, tipo, capacidad, ubicacion, estado }) => ({
  nombre: validarNombreAmbiente(nombre),
  tipo: validarTipo(tipo),
  capacidad: validarCapacidad(capacidad),
  ubicacion: validarUbicacion(ubicacion),
  estado: validarEstadoAmbiente(estado),
})

export const validarReserva = ({ ambienteId, fecha, horaInicio, horaFin, motivo }) => ({
  ambienteId: validarAmbienteId(ambienteId),
  fecha: validarFecha(fecha),
  horaInicio: validarHoraInicio(horaInicio),
  horaFin: validarHoraFin(horaFin, horaInicio),
  motivo: validarMotivo(motivo),
})
