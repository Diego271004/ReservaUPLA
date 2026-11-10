import { minutosDeHora } from './fechas.js'

export const INICIO_DIA = 7 * 60
export const FIN_DIA = 22 * 60

export function minutosDesdeInicio(hora) {
  return minutosDeHora(hora) - INICIO_DIA
}

export function tramoPorCentaje(inicio, fin) {
  return `${((fin - inicio) / (FIN_DIA - INICIO_DIA)) * 100}%`
}

export function leftPorCentaje(hora) {
  return `${((minutosDeHora(hora) - INICIO_DIA) / (FIN_DIA - INICIO_DIA)) * 100}%`
}

export function fusionarBloques(bloques = []) {
  const ocupados = [...bloques]
    .filter((bloque) => bloque?.horaInicio && bloque?.horaFin)
    .sort((a, b) => minutosDeHora(a.horaInicio) - minutosDeHora(b.horaInicio))

  const fusionados = []
  for (const bloque of ocupados) {
    const anterior = fusionados.at(-1)
    if (
      anterior &&
      anterior.estado === bloque.estado &&
      minutosDeHora(anterior.horaFin) === minutosDeHora(bloque.horaInicio)
    ) {
      anterior.horaFin = bloque.horaFin
      anterior.ids = [...(anterior.ids ?? [anterior.id]), bloque.id]
    } else {
      fusionados.push({ ...bloque, ids: [bloque.id] })
    }
  }
  return fusionados
}

export function tramosFusionados(bloques = []) {
  const ocupados = fusionarBloques(bloques).sort(
    (a, b) => minutosDeHora(a.horaInicio) - minutosDeHora(b.horaInicio),
  )
  const tramos = []
  let cursor = INICIO_DIA

  for (const bloque of ocupados) {
    const inicio = minutosDeHora(bloque.horaInicio)
    const fin = minutosDeHora(bloque.horaFin)
    if (inicio > cursor) {
      tramos.push({
        tipo: 'libre',
        horaInicio: minutosAHora(cursor),
        horaFin: minutosAHora(inicio),
      })
    }
    tramos.push({ tipo: 'ocupado', ...bloque })
    cursor = Math.max(cursor, fin)
  }
  if (cursor < FIN_DIA) {
    tramos.push({
      tipo: 'libre',
      horaInicio: minutosAHora(cursor),
      horaFin: minutosAHora(FIN_DIA),
    })
  }
  return tramos
}

export function minutosAHora(minutos) {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
}

export function asignarCarrilesReservas(bloques = []) {
  const ocupados = [...bloques]
    .filter((bloque) => bloque?.horaInicio && bloque?.horaFin)
    .sort((a, b) => minutosDeHora(a.horaInicio) - minutosDeHora(b.horaInicio))
  const finPorCarril = []

  return ocupados.map((bloque) => {
    const inicio = minutosDeHora(bloque.horaInicio)
    const fin = minutosDeHora(bloque.horaFin)
    let carril = finPorCarril.findIndex((finAnterior) => finAnterior <= inicio)
    if (carril === -1) carril = finPorCarril.length
    finPorCarril[carril] = fin
    return { ...bloque, carril }
  })
}

export function tramosLibresBase(bloques = []) {
  const ocupados = [...bloques]
    .filter((bloque) => bloque?.horaInicio && bloque?.horaFin)
    .sort((a, b) => minutosDeHora(a.horaInicio) - minutosDeHora(b.horaInicio))
  const tramos = []
  let cursor = INICIO_DIA

  for (const bloque of ocupados) {
    const inicio = Math.max(cursor, minutosDeHora(bloque.horaInicio))
    if (inicio > cursor) {
      tramos.push({
        tipo: 'libre',
        horaInicio: minutosAHora(cursor),
        horaFin: minutosAHora(inicio),
      })
    }
    cursor = Math.max(cursor, minutosDeHora(bloque.horaFin))
  }
  if (cursor < FIN_DIA) {
    tramos.push({
      tipo: 'libre',
      horaInicio: minutosAHora(cursor),
      horaFin: minutosAHora(FIN_DIA),
    })
  }
  return tramos
}

export function claseDuracionLibre(inicio, fin) {
  const duracion = minutosDeHora(fin) - minutosDeHora(inicio)
  if (duracion <= 30) return 'muy-corto'
  if (duracion <= 60) return 'corto'
  return 'medio'
}

export function horaAbreviada(hora) {
  if (!hora) return ''
  const [h, m] = hora.split(':').map(Number)
  return m === 0 ? String(h) : `${h}:${String(m).padStart(2, '0')}`
}

/**
 * El texto que cabe dentro de un tramo de la línea de tiempo (desde 07:00 hasta 22:00 en un ancho variable). Nunca se corta:
 * lo que no cabe se quita del texto y queda en el icono (el estado) y en el aria-label/title (el detalle completo).
 * - Libre: vacío hasta 30 min, «Libre» hasta 3 h y «Libre 10–14 h» para tramos más largos.
 * - Reservado: vacío hasta 45 min y «10–12 h» desde ahí (el estado lo dice el icono, no una palabra que no cabe).
 */
export function textoVisibleBloque(tramo) {
  if (!tramo) return ''
  const duracion = minutosDeHora(tramo.horaFin) - minutosDeHora(tramo.horaInicio)
  const hInicio = horaAbreviada(tramo.horaInicio)
  const hFin = horaAbreviada(tramo.horaFin)

  if (tramo.tipo === 'libre') {
    if (duracion <= 30) return ''
    if (duracion <= 180) return 'Libre'
    return `Libre ${hInicio}–${hFin} h`
  }

  if (duracion <= 45) return ''
  return `${hInicio}–${hFin} h`
}

/**
 * El porcentaje del día (07:00 a 22:00) que un ambiente tiene reservado con reservas APROBADAS (redondeado), o null si
 * el ambiente está en mantenimiento. Las pendientes no cuentan: todavía no ocupan el ambiente (RN-01).
 */
export function porcentajeDeOcupacion(ambiente) {
  if (ambiente.estado !== 'Disponible') return null
  const aprobadas = (ambiente.bloques ?? []).filter((bloque) => bloque.estado === 'Aprobada')
  const minutos = aprobadas.reduce((suma, bloque) => {
    const inicio = Math.max(minutosDeHora(bloque.horaInicio), INICIO_DIA)
    const fin = Math.min(minutosDeHora(bloque.horaFin), FIN_DIA)
    return suma + Math.max(0, fin - inicio)
  }, 0)
  return Math.min(100, Math.round((minutos / (FIN_DIA - INICIO_DIA)) * 100))
}
