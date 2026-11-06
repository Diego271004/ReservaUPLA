import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import { Icono } from '../ui/Icono.jsx'
import EjeTiempo from './EjeTiempo.jsx'
import { minutosDeHora } from '../../utils/fechas.js'
import {
  asignarCarrilesReservas,
  leftPorCentaje,
  tramoPorCentaje,
  tramosFusionados,
  tramosLibresBase,
} from '../../utils/disponibilidad.js'
import estilos from '../../pages/DisponibilidadPage.module.css'

export function elementosFila(ambiente) {
  return ambiente.estado === 'En mantenimiento'
    ? [{ tipo: 'mantenimiento', horaInicio: '07:00', horaFin: '22:00' }]
    : tramosFusionados(ambiente.bloques)
}

function iconoEstado(tramo) {
  if (tramo.tipo === 'libre') return 'exito'
  if (tramo.estado === 'Aprobada') return 'marca'
  if (tramo.estado === 'Pendiente') return 'reloj'
  return 'aviso'
}

export function BloquesEscritorio({
  ambientes,
  datos,
  hoySeleccionado,
  ahora,
  rol,
  past,
  responsable,
  alElegirReserva,
}) {
  const navigate = useNavigate()
  const refs = useRef({})

  const registrarRef = (clave) => (el) => {
    if (el) {
      refs.current[clave] = el
    } else {
      delete refs.current[clave]
    }
  }

  const textoBloque = (ambiente, tramo) => {
    if (ambiente.estado === 'En mantenimiento')
      return `${ambiente.nombre}: mantenimiento, todo el día`
    if (tramo.tipo === 'libre')
      return `${ambiente.nombre}: Libre, ${tramo.horaInicio} a ${tramo.horaFin}`
    const privado = rol === 'Solicitante' && !tramo.propia
    const detalle = [`${tramo.horaInicio}–${tramo.horaFin}`, tramo.estado]
    if (!privado && (rol === 'Administrador' || rol === 'Responsable')) {
      if (tramo.solicitanteNombre) detalle.push(tramo.solicitanteNombre)
      if (tramo.motivo) detalle.push(tramo.motivo)
    }
    return `${ambiente.nombre}: ${detalle.join(', ')}`
  }

  const moverFoco = (fila, elemento, direccion, vertical) => {
    const base = Object.values(refs.current).filter(
      (item) => item && document.body.contains(item),
    )
    const enFila = base.filter((item) => item?.dataset.fila === String(fila))
    if (vertical) {
      const otraFila = base.filter((item) => item?.dataset.fila === String(fila + direccion))
      if (otraFila.length > 0) {
        const rectActual = elemento.getBoundingClientRect()
        let masCercano = otraFila[0]
        let menorDistancia = Math.abs(masCercano.getBoundingClientRect().left - rectActual.left)
        for (const item of otraFila) {
          const dist = Math.abs(item.getBoundingClientRect().left - rectActual.left)
          if (dist < menorDistancia) {
            menorDistancia = dist
            masCercano = item
          }
        }
        masCercano?.focus()
      }
      return
    }
    const actual = enFila.findIndex((item) => item === elemento)
    if (actual !== -1) {
      const siguiente = enFila[Math.max(0, Math.min(enFila.length - 1, actual + direccion))]
      siguiente?.focus()
    }
  }

  return (
    <div className={estilos.desktop}>
      <div className={estilos.nombreEje} />
      <EjeTiempo ahora={ahora} hoy={hoySeleccionado} />
      {ambientes.map((ambiente, fila) => (
        <div className={estilos.filaAmbiente} key={ambiente.id}>
          <div className={estilos.nombreAmbiente}>{ambiente.nombre}</div>
          <div
            className={estilos.lineaTiempo}
            style={{
              height: `${Math.max(64, 64 + asignarCarrilesReservas(ambiente.bloques ?? []).reduce((maximo, bloque) => Math.max(maximo, bloque.carril), 0) * 56)}px`,
            }}
          >
            {ambiente.estado === 'En mantenimiento' && (
              <Button
                variante="secundario"
                className={`${estilos.bloque} ${estilos.mantenimiento}`}
                deshabilitado
                aria-label={`${ambiente.nombre}: mantenimiento, todo el día`}
                title={`${ambiente.nombre}: mantenimiento, todo el día`}
                style={{
                  left: leftPorCentaje('07:00'),
                  width: tramoPorCentaje(420, 1320),
                  top: '8px',
                }}
              >
                <Icono nombre="aviso" />
                <span>Mantenimiento</span>
              </Button>
            )}
            {ambiente.estado !== 'En mantenimiento' &&
              tramosLibresBase(ambiente.bloques ?? []).map((tramo, indice) => {
                const inicio = minutosDeHora(tramo.horaInicio)
                const fin = minutosDeHora(tramo.horaFin)
                const deshabilitado =
                  past || datos.soloLectura || ambiente.estado === 'En mantenimiento' || responsable
                const duracion = fin - inicio
                const claseDuracion =
                  duracion <= 30
                    ? estilos.libreMuyCorto
                    : duracion <= 60
                      ? estilos.libreCorto
                      : estilos.libreMedio
                return (
                  <Button
                    key={`libre-${tramo.horaInicio}`}
                    variante="secundario"
                    className={`${estilos.bloque} ${estilos.libre} ${claseDuracion}`}
                    deshabilitado={deshabilitado}
                    aria-label={textoBloque(ambiente, tramo)}
                    title={textoBloque(ambiente, tramo)}
                    data-fila={fila}
                    data-indice={indice}
                    inputRef={registrarRef(`libre-${fila}-${indice}-${tramo.horaInicio}`)}
                    onKeyDown={(evento) => {
                      if (evento.key === 'ArrowRight')
                        moverFoco(fila, evento.currentTarget, 1, false)
                      if (evento.key === 'ArrowLeft')
                        moverFoco(fila, evento.currentTarget, -1, false)
                      if (evento.key === 'ArrowDown') moverFoco(fila, evento.currentTarget, 1, true)
                      if (evento.key === 'ArrowUp') moverFoco(fila, evento.currentTarget, -1, true)
                      if (evento.key.startsWith('Arrow')) evento.preventDefault()
                      if (evento.key === 'Enter' || evento.key === ' ') {
                        if (!deshabilitado) {
                          evento.preventDefault()
                          navigate(
                            `/reservas/nueva?ambienteId=${ambiente.id}&fecha=${datos.fecha}&horaInicio=${tramo.horaInicio}&horaFin=${tramo.horaFin}`,
                          )
                        }
                      }
                    }}
                    onClick={() => {
                      if (!deshabilitado)
                        navigate(
                          `/reservas/nueva?ambienteId=${ambiente.id}&fecha=${datos.fecha}&horaInicio=${tramo.horaInicio}&horaFin=${tramo.horaFin}`,
                        )
                    }}
                    style={{
                      left: leftPorCentaje(tramo.horaInicio),
                      width: tramoPorCentaje(inicio, fin),
                    }}
                  >
                    <Icono nombre="exito" />
                    <span className={estilos.textoLibre}>
                      {tramo.horaInicio === '07:00'
                        ? `Libre ${tramo.horaInicio}–${tramo.horaFin}`
                        : `${tramo.horaInicio}–${tramo.horaFin}`}
                    </span>
                  </Button>
                )
              })}
            {ambiente.estado !== 'En mantenimiento' &&
              asignarCarrilesReservas(ambiente.bloques ?? []).map((tramo, indice) => {
                const inicio = minutosDeHora(tramo.horaInicio)
                const fin = minutosDeHora(tramo.horaFin)
                const clase = tramo.estado === 'Aprobada' ? estilos.aprobada : estilos.pendiente
                return (
                  <Button
                    key={`reserva-${tramo.id ?? indice}-${tramo.horaInicio}`}
                    variante="secundario"
                    className={`${estilos.bloque} ${clase}`}
                    aria-label={textoBloque(ambiente, { tipo: 'ocupado', ...tramo })}
                    title={textoBloque(ambiente, { tipo: 'ocupado', ...tramo })}
                    data-fila={fila}
                    data-indice={indice}
                    inputRef={registrarRef(
                      `reserva-${fila}-${indice}-${tramo.id ?? tramo.horaInicio}`,
                    )}
                    style={{
                      left: leftPorCentaje(tramo.horaInicio),
                      width: tramoPorCentaje(inicio, fin),
                      top: `${8 + tramo.carril * 56}px`,
                    }}
                    onKeyDown={(evento) => {
                      if (evento.key === 'ArrowRight')
                        moverFoco(fila, evento.currentTarget, 1, false)
                      if (evento.key === 'ArrowLeft')
                        moverFoco(fila, evento.currentTarget, -1, false)
                      if (evento.key === 'ArrowDown') moverFoco(fila, evento.currentTarget, 1, true)
                      if (evento.key === 'ArrowUp') moverFoco(fila, evento.currentTarget, -1, true)
                      if (evento.key.startsWith('Arrow')) evento.preventDefault()
                      if (evento.key === 'Enter' || evento.key === ' ') {
                        evento.preventDefault()
                        alElegirReserva?.(tramo, ambiente)
                      }
                    }}
                    onClick={() => alElegirReserva?.(tramo, ambiente)}
                  >
                    <Icono nombre={tramo.estado === 'Aprobada' ? 'marca' : 'reloj'} />
                    <span>{`${tramo.horaInicio}–${tramo.horaFin} · ${tramo.estado}`}</span>
                  </Button>
                )
              })}
            {hoySeleccionado && (
              <div
                className={estilos.lineaAhora}
                style={{
                  left: leftPorCentaje(
                    `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`,
                  ),
                }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AgendaMovil({ ambientes, datos, past, responsable, alElegirReserva }) {
  const navigate = useNavigate()
  return (
    <div className={estilos.mobile}>
      {ambientes.map((ambiente) => (
        <article className={estilos.tarjetaAmbiente} key={ambiente.id}>
          <h2>{ambiente.nombre}</h2>
          <div className={estilos.listaMovil}>
            {elementosFila(ambiente).map((tramo, indice) => {
              const libre = tramo.tipo === 'libre'
              const deshabilitado =
                past ||
                datos.soloLectura ||
                ambiente.estado === 'En mantenimiento' ||
                (responsable && libre)
              const clase =
                ambiente.estado === 'En mantenimiento'
                  ? estilos.mantenimiento
                  : libre
                    ? estilos.libre
                    : tramo.estado === 'Aprobada'
                      ? estilos.aprobada
                      : estilos.pendiente
              const texto =
                ambiente.estado === 'En mantenimiento'
                  ? `${tramo.horaInicio}–${tramo.horaFin} Mantenimiento`
                  : `${tramo.horaInicio}–${tramo.horaFin} ${libre ? 'Libre' : tramo.estado}`
              return (
                <Button
                  key={`${tramo.id ?? tramo.tipo}-${indice}`}
                  variante="secundario"
                  deshabilitado={deshabilitado}
                  className={`${estilos.itemMovil} ${clase}`}
                  aria-label={`${ambiente.nombre}: ${texto}`}
                  onClick={() => {
                    if (libre && !deshabilitado) {
                      navigate(
                        `/reservas/nueva?ambienteId=${ambiente.id}&fecha=${datos.fecha}&horaInicio=${tramo.horaInicio}&horaFin=${tramo.horaFin}`,
                      )
                    } else if (!libre && ambiente.estado !== 'En mantenimiento') {
                      alElegirReserva?.(tramo, ambiente)
                    }
                  }}
                >
                  <Icono
                    nombre={ambiente.estado === 'En mantenimiento' ? 'aviso' : iconoEstado(tramo)}
                  />
                  <span>{texto}</span>
                </Button>
              )
            })}
          </div>
        </article>
      ))}
    </div>
  )
}
