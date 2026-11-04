import { useLocation, useNavigate } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import TableList from '../components/ui/TableList.jsx'
import { TEXTOS } from '../constants/messages.js'
import { useCarga } from '../hooks/useCarga.js'
import estilos from './ListadoPage.module.css'

/**
 * Pantalla de listado con botón "Nuevo ..." (Usuarios y Ambientes comparten esta estructura). Muestra el
 * mensaje de éxito con que se vuelve de un formulario de registro (state.exito del router).
 */
export default function ListadoPage({ titulo, textoNuevo, rutaNuevo, cargar, columnas }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { datos, cargando, error, recargar } = useCarga(cargar)

  return (
    <>
      <div className={estilos.encabezado}>
        <h1>{titulo}</h1>
        <Button onClick={() => navigate(rutaNuevo)}>{textoNuevo}</Button>
      </div>
      {state?.exito && <AlertMessage tipo="exito">{state.exito}</AlertMessage>}
      {error && (
        <AlertMessage tipo="error">
          {error}{' '}
          <Button variante="enlace" onClick={recargar}>
            Reintentar
          </Button>
        </AlertMessage>
      )}
      {cargando ? (
        <p role="status">{TEXTOS.cargando}</p>
      ) : (
        !error && <TableList titulo={titulo} columnas={columnas} filas={datos} />
      )}
    </>
  )
}
