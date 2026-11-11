import { useCallback } from 'react'
import { contarReservasPorEstado } from '../services/recursosService.js'
import { claveDeConteo, filtrosDeBusqueda } from '../utils/filtrosDeReservas.js'
import { useCarga } from './useCarga.js'

const SIN_CONTEOS = null

export function useConteoPorEstado(clave) {
  const claveConteo = claveDeConteo(filtrosDeBusqueda(new URLSearchParams(clave)))
  const cargar = useCallback(
    () => contarReservasPorEstado(filtrosDeBusqueda(new URLSearchParams(claveConteo))),
    [claveConteo],
  )
  return useCarga(cargar, SIN_CONTEOS)
}
