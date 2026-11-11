import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormulario } from './useFormulario.js'

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
