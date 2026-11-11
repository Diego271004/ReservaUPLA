import { useCallback, useMemo } from 'react'
import { MENSAJES } from '../constants/messages.js'
import { ROLES } from '../constants/navegacion.js'
import { crearAmbiente, listarUsuarios } from '../services/recursosService.js'
import { validarAmbiente } from '../utils/validators.js'
import { useCarga } from './useCarga.js'
import { useFormularioDeRegistro } from './useFormularioDeRegistro.js'

export const RUTA_AMBIENTES = '/ambientes'
const VALORES_INICIALES = {
  nombre: '',
  tipo: '',
  capacidad: '',
  ubicacion: '',
  estado: '',
  responsableId: '',
}

const cargarResponsables = () => listarUsuarios(ROLES.responsable)

export function useAmbienteForm() {
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

  const formulario = useFormularioDeRegistro({
    valoresIniciales: VALORES_INICIALES,
    validar: validarAmbiente,
    enviar,
    rutaListado: RUTA_AMBIENTES,
    mensajeExito: MENSAJES.ambienteRegistrado,
  })

  return { ...formulario, opcionesResponsable, errorResponsables: responsables.error }
}
