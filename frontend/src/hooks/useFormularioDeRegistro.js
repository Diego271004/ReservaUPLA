import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormulario } from './useFormulario.js'

/**
 * Formulario de registro de Usuarios y Ambientes: lo común de los dos (al guardar, volver al listado con el mensaje de
 * éxito; "Cancelar" vuelve al listado) vive aquí. Cada pantalla solo aporta sus campos, su validación y su llamada.
 */
export function useFormularioDeRegistro({
  valoresIniciales,
  validar,
  enviar,
  rutaListado,
  mensajeExito,
}) {
  const navigate = useNavigate()

  const alExito = useCallback(
    () => navigate(rutaListado, { state: { exito: mensajeExito } }),
    [navigate, rutaListado, mensajeExito],
  )

  const formulario = useFormulario({ valoresIniciales, validar, enviar, alExito })

  return { ...formulario, cancelar: () => navigate(rutaListado) }
}
