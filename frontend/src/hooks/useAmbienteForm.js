import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MENSAJES } from '../constants/messages.js'
import { ROLES } from '../constants/navegacion.js'
import { crearAmbiente, listarUsuarios } from '../services/recursosService.js'
import { validarAmbiente } from '../utils/validators.js'
import { useCarga } from './useCarga.js'
import { useFormulario } from './useFormulario.js'

export const RUTA_AMBIENTES = '/ambientes'
const VALORES_INICIALES = {
  nombre: '',
  tipo: '',
  capacidad: '',
  ubicacion: '',
  estado: '',
  responsableId: '',
}

// Función estable para useCarga: solo los usuarios con rol Responsable pueden asignarse a un ambiente.
const cargarResponsables = () => listarUsuarios(ROLES.responsable)

export function useAmbienteForm() {
  const navigate = useNavigate()
  const responsables = useCarga(cargarResponsables)

  const opcionesResponsable = useMemo(
    () =>
      responsables.datos
        .filter((usuario) => usuario.activo)
        .map((usuario) => ({ valor: String(usuario.id), etiqueta: usuario.nombreCompleto })),
    [responsables.datos],
  )

  const enviar = useCallback(
    (valores, { signal }) =>
      crearAmbiente(
        {
          nombre: valores.nombre.trim(),
          tipo: valores.tipo,
          capacidad: Number(valores.capacidad.trim()),
          ubicacion: valores.ubicacion.trim(),
          estado: valores.estado,
          responsableId: valores.responsableId === '' ? null : Number(valores.responsableId),
        },
        { signal },
      ),
    [],
  )

  const alExito = useCallback(
    () => navigate(RUTA_AMBIENTES, { state: { exito: MENSAJES.ambienteRegistrado } }),
    [navigate],
  )

  const formulario = useFormulario({
    valoresIniciales: VALORES_INICIALES,
    validar: validarAmbiente,
    enviar,
    alExito,
  })

  return {
    ...formulario,
    opcionesResponsable,
    errorResponsables: responsables.error,
    cancelar: () => navigate(RUTA_AMBIENTES),
  }
}
