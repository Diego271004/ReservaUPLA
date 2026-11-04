import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MENSAJES } from '../constants/messages.js'
import { crearUsuario } from '../services/recursosService.js'
import { normalizarCorreo, validarUsuario } from '../utils/validators.js'
import { useFormulario } from './useFormulario.js'

export const RUTA_USUARIOS = '/usuarios'
const VALORES_INICIALES = { nombreCompleto: '', correo: '', rol: '', activo: true, contrasena: '' }

export function useUsuarioForm() {
  const navigate = useNavigate()

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

  const alExito = useCallback(
    () => navigate(RUTA_USUARIOS, { state: { exito: MENSAJES.usuarioRegistrado } }),
    [navigate],
  )

  const formulario = useFormulario({
    valoresIniciales: VALORES_INICIALES,
    validar: validarUsuario,
    enviar,
    alExito,
  })

  return { ...formulario, cancelar: () => navigate(RUTA_USUARIOS) }
}
