import { useCallback } from 'react'
import { contarReservasPorEstado } from '../services/recursosService.js'
import { claveDeConteo, filtrosDeBusqueda } from '../utils/filtrosDeReservas.js'
import { useCarga } from './useCarga.js'

const SIN_CONTEOS = null

/**
 * Los números de las pestañas de Reservas: cuántas reservas hay en cada estado con los demás filtros de la dirección
 * (`clave` = la consulta de la dirección, p. ej. «ambienteId=1&pagina=2»; el estado y la página no cambian los números).
 * Devuelve { datos: { Pendiente, Aprobada, … } | null, cargando, error, recargar }.
 */
export function useConteoPorEstado(clave) {
  const claveConteo = claveDeConteo(filtrosDeBusqueda(new URLSearchParams(clave)))
  const cargar = useCallback(
    () => contarReservasPorEstado(filtrosDeBusqueda(new URLSearchParams(claveConteo))),
    [claveConteo],
  )
  return useCarga(cargar, SIN_CONTEOS)
}
