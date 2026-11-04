import CampoFormulario from './CampoFormulario.jsx'
import estilos from './TextInput.module.css'

/**
 * Campo de texto con etiqueta, ayuda y error. `multilinea` lo convierte en área de texto (Motivo).
 * `accion` es un botón que va dentro de la caja, a la derecha (por ejemplo "Mostrar" en la contraseña).
 * El campo no lleva texto de ejemplo dentro: el ejemplo va como ayuda debajo.
 */
export default function TextInput({
  id,
  nombre,
  etiqueta,
  valor,
  onChange,
  onBlur,
  ayuda,
  error,
  aviso,
  tipo = 'text',
  deshabilitado = false,
  soloLectura = false,
  multilinea = false,
  filas = 4,
  autoComplete,
  inputRef,
  accion,
  ...resto
}) {
  const Control = multilinea ? 'textarea' : 'input'
  return (
    <CampoFormulario
      id={id}
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      aviso={aviso}
      deshabilitado={deshabilitado || soloLectura}
      iconoFinal={accion ? <span className={estilos.accion}>{accion}</span> : null}
    >
      {(propsControl) => (
        <Control
          {...propsControl}
          {...resto}
          ref={inputRef}
          name={nombre}
          type={multilinea ? undefined : tipo}
          rows={multilinea ? filas : undefined}
          value={valor}
          onChange={onChange}
          onBlur={onBlur}
          disabled={deshabilitado}
          readOnly={soloLectura}
          autoComplete={autoComplete}
        />
      )}
    </CampoFormulario>
  )
}
