import { useCallback, useRef } from 'react'
import { TEXTOS } from '../../constants/messages.js'
import { etiquetaDeAmbiente } from '../../hooks/useReservaForm.js'
import { Icono, IconoError, iconoDeTipoAmbiente } from './Icono.jsx'
import estilos from './SelectorDeAmbientes.module.css'

/**
 * Selector de ambientes mediante tarjetas en un grupo de radio accesible (WAI-ARIA).
 * Flechas navegan y eligen entre las opciones disponibles; Espacio o Enter seleccionan.
 * Un ambiente en mantenimiento se muestra deshabilitado con su motivo visible.
 */
export default function SelectorDeAmbientes({
  id = 'ambienteId',
  nombre = 'ambienteId',
  etiqueta = TEXTOS.etiquetaAmbiente,
  valor,
  ambientes = [],
  onChange,
  onBlur,
  ayuda,
  error,
  deshabilitado = false,
  inputRef,
}) {
  const tarjetasRef = useRef({})
  const contenedorRef = useRef(null)

  const habilitados = ambientes.filter((a) => a.estado === 'Disponible')

  const seleccionar = useCallback(
    (idAmbiente) => {
      if (deshabilitado) return
      onChange?.({ target: { name: nombre, value: String(idAmbiente) } })
    },
    [deshabilitado, nombre, onChange],
  )

  const manejarTeclado = useCallback(
    (evento, idActual) => {
      const teclasNavegacion = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End']
      if (teclasNavegacion.includes(evento.key)) {
        evento.preventDefault()
        if (habilitados.length === 0) return

        const indiceActual = habilitados.findIndex((a) => String(a.id) === String(idActual))
        let siguienteIndice = 0

        if (evento.key === 'ArrowDown' || evento.key === 'ArrowRight') {
          siguienteIndice = indiceActual >= 0 ? (indiceActual + 1) % habilitados.length : 0
        } else if (evento.key === 'ArrowUp' || evento.key === 'ArrowLeft') {
          siguienteIndice =
            indiceActual >= 0
              ? (indiceActual - 1 + habilitados.length) % habilitados.length
              : habilitados.length - 1
        } else if (evento.key === 'Home') {
          siguienteIndice = 0
        } else if (evento.key === 'End') {
          siguienteIndice = habilitados.length - 1
        }

        const siguiente = habilitados[siguienteIndice]
        if (siguiente) {
          seleccionar(siguiente.id)
          tarjetasRef.current[siguiente.id]?.focus()
        }
      } else if (
        evento.key === ' ' ||
        evento.key === 'Space' ||
        evento.key === 'Spacebar' ||
        evento.key === 'Enter' ||
        evento.code === 'Space'
      ) {
        evento.preventDefault()
        const ambiente = ambientes.find((a) => String(a.id) === String(idActual))
        if (ambiente && ambiente.estado === 'Disponible') {
          seleccionar(ambiente.id)
        }
      }
    },
    [ambientes, habilitados, seleccionar],
  )

  const idEtiqueta = `${id}-etiqueta`
  const idAyuda = ayuda ? `${id}-ayuda` : null
  const idError = error ? `${id}-error` : null
  const describedBy = [idError, idAyuda].filter(Boolean).join(' ')

  const idPrimerHabilitado = habilitados[0]?.id

  const asignarTarjetaRef = (elemento, ambId, esPrimerHabilitado) => {
    tarjetasRef.current[ambId] = elemento
    if ((valor && String(valor) === String(ambId)) || (!valor && esPrimerHabilitado)) {
      if (typeof inputRef === 'function') {
        inputRef(elemento)
      }
    }
  }

  return (
    <div className={estilos.campo}>
      <span id={idEtiqueta} className={estilos.etiqueta}>
        {etiqueta}
      </span>
      <div
        id={id}
        ref={contenedorRef}
        role="radiogroup"
        aria-labelledby={idEtiqueta}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? 'true' : undefined}
        className={estilos.rejilla}
        onBlur={onBlur}
      >
        {ambientes.map((ambiente) => {
          const seleccionado = String(ambiente.id) === String(valor)
          const enMantenimiento = ambiente.estado !== 'Disponible'
          const estaDeshabilitado = deshabilitado || enMantenimiento
          const esPrimerHabilitado = ambiente.id === idPrimerHabilitado

          const tabIndex =
            !estaDeshabilitado && (seleccionado || (!valor && esPrimerHabilitado)) ? 0 : -1

          const clasesTarjeta = [
            estilos.tarjeta,
            seleccionado ? estilos.seleccionada : '',
            estaDeshabilitado ? estilos.deshabilitada : '',
            error ? estilos.conError : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <div
              key={ambiente.id}
              ref={(el) => asignarTarjetaRef(el, ambiente.id, esPrimerHabilitado)}
              role="radio"
              tabIndex={tabIndex}
              aria-checked={seleccionado}
              aria-disabled={estaDeshabilitado ? 'true' : undefined}
              aria-label={etiquetaDeAmbiente(ambiente)}
              className={clasesTarjeta}
              onClick={() => !estaDeshabilitado && seleccionar(ambiente.id)}
              onKeyDown={(e) => manejarTeclado(e, ambiente.id)}
            >
              <div className={estilos.cabeceraTarjeta}>
                <span className={estilos.iconoTipo}>
                  <Icono nombre={iconoDeTipoAmbiente(ambiente.tipo)} tamano={22} />
                </span>
                {enMantenimiento ? (
                  <span className={estilos.badgeMantenimiento}>
                    <Icono nombre="aviso" tamano={14} />
                    <span>En mantenimiento (no disponible)</span>
                  </span>
                ) : (
                  <span className={estilos.badgeDisponible}>
                    <Icono nombre="exito" tamano={14} />
                    <span>Disponible</span>
                  </span>
                )}
              </div>

              <div className={estilos.cuerpoTarjeta}>
                <span className={estilos.nombre}>{ambiente.nombre}</span>
                <span className={estilos.detalles}>
                  {ambiente.capacidad} {TEXTOS.personas} · {ambiente.ubicacion}
                </span>
              </div>

              <div className={estilos.pieTarjeta}>
                <span
                  className={`${estilos.indicadorRadio} ${seleccionado ? estilos.indicadorRadioSeleccionado : ''}`}
                  aria-hidden="true"
                >
                  {seleccionado && <span className={estilos.puntoActivo} />}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {ayuda && (
        <p id={idAyuda} className={estilos.ayuda}>
          {ayuda}
        </p>
      )}

      {error && (
        <p id={idError} className={estilos.error}>
          <IconoError className={estilos.iconoError} />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
