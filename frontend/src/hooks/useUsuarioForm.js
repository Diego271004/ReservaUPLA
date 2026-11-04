import { useCallback } from 'react'
import { MENSAJES } from '../constants/messages.js'
import { crearUsuario } from '../services/recursosService.js'
import { normalizarCorreo, validarUsuario } from '../utils/validators.js'
import { useFormularioDeRegistro } from './useFormularioDeRegistro.js'

export const RUTA_USUARIOS = '/usuarios'
const VALORES_INICIALES = { nombreCompleto: '', correo: '', rol: '', activo: true, contrasena: '' }

export function useUsuarioForm() {
  const enviar = useCallback(
    (valores, { signal }) =>
      crearUsuario(
        {
          nombreCompleto: valores.nombreCompleto.trim(),
          correo: normalizarCorreo(valores.correo),
          rol: valores.rol,
          activo: valores.activo,
          contrasena: valores.contrasena, // la contraseña no se recorta
        },
        { signal },
      ),
    [],
  )

  return useFormularioDeRegistro({
    valoresIniciales: VALORES_INICIALES,
    validar: validarUsuario,
    enviar,
    rutaListado: RUTA_USUARIOS,
    mensajeExito: MENSAJES.usuarioRegistrado,
  })
}
