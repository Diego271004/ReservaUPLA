import { useEffect, useState } from 'react'
import { consultarSalud } from '../services/saludService'

export const ESTADOS_SALUD = {
  cargando: 'cargando',
  disponible: 'disponible',
  sinConexion: 'sinConexion',
}

export function useSalud() {
  const [estado, setEstado] = useState(ESTADOS_SALUD.cargando)

  useEffect(() => {
    let activo = true
    consultarSalud().then((disponible) => {
      if (activo) {
        setEstado(disponible ? ESTADOS_SALUD.disponible : ESTADOS_SALUD.sinConexion)
      }
    })
    return () => {
      activo = false
    }
  }, [])

  return estado
}
