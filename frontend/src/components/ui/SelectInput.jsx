import { TEXTOS } from '../../constants/messages.js'
import CampoFormulario from './CampoFormulario.jsx'
import { Icono } from './Icono.jsx'
import estilos from './SelectInput.module.css'

/**
 * Lista cerrada (el usuario solo puede elegir una opción de la lista). Vacío muestra "Selecciona…" y la
 * flecha siempre es visible. `opciones`: [{ valor, etiqueta, deshabilitada }]. `icono` cambia la flecha
 * por otro icono (TimeInput usa el reloj).
 */
export default function SelectInput({
  id,
  nombre,
  etiqueta,
  valor,
  opciones,
  onChange,
  onBlur,
  ayuda,
  error,
  deshabilitado = false,
  textoVacio = TEXTOS.seleccionar,
  icono = 'flecha',
  inputRef,
}) {
  return (
    <CampoFormulario
      id={id}
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      deshabilitado={deshabilitado}
      iconoFinal={<Icono nombre={icono} className={estilos.icono} />}
    >
      {(propsControl) => (
        <select
          {...propsControl}
          ref={inputRef}
          name={nombre}
          value={valor}
          onChange={onChange}
          onBlur={onBlur}
          disabled={deshabilitado}
        >
          <option value="">{textoVacio}</option>
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor} disabled={opcion.deshabilitada}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      )}
    </CampoFormulario>
  )
}
