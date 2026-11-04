import { IconoError, Icono } from './Icono.jsx'
import estilos from './CampoFormulario.module.css'

/** ids estables de los textos asociados a un campo (aria-describedby). */
export const idsDeCampo = (id) => ({
  ayuda: `${id}-ayuda`,
  error: `${id}-error`,
  aviso: `${id}-aviso`,
})

/**
 * Estructura común de TextInput, SelectInput, DateInput y TimeInput: etiqueta siempre visible, caja del
 * control, ayuda con ejemplo, error con el icono único y aviso. `children` recibe las props que el control
 * debe llevar (id, aria-*, className).
 */
export default function CampoFormulario({
  id,
  etiqueta,
  ayuda,
  error,
  aviso,
  deshabilitado,
  iconoFinal,
  children,
}) {
  const ids = idsDeCampo(id)
  const describedBy = [error && ids.error, aviso && ids.aviso, ayuda && ids.ayuda]
    .filter(Boolean)
    .join(' ')

  const clasesCaja = [
    estilos.caja,
    error ? estilos.conError : '',
    deshabilitado ? estilos.deshabilitado : '',
  ].join(' ')

  return (
    <div className={estilos.campo}>
      <label htmlFor={id} className={estilos.etiqueta}>
        {etiqueta}
      </label>
      <div className={clasesCaja}>
        {children({
          id,
          className: estilos.control,
          'aria-invalid': error ? 'true' : undefined,
          'aria-describedby': describedBy || undefined,
        })}
        {iconoFinal}
      </div>
      {ayuda && (
        <p id={ids.ayuda} className={estilos.ayuda}>
          {ayuda}
        </p>
      )}
      {error && (
        <p id={ids.error} className={estilos.error}>
          <IconoError className={estilos.icono} />
          <span>{error}</span>
        </p>
      )}
      {aviso && (
        <p id={ids.aviso} role="status" className={estilos.aviso}>
          <Icono nombre="aviso" className={estilos.icono} />
          <span>{aviso}</span>
        </p>
      )}
    </div>
  )
}
