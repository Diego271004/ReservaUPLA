import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AlertMessage from '../components/ui/AlertMessage.jsx'
import Button from '../components/ui/Button.jsx'
import EsqueletoDeLista from '../components/ui/EsqueletoDeLista.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import TableList from '../components/ui/TableList.jsx'
import { TEXTOS } from '../constants/messages.js'
import { useAvisos } from '../context/AvisosContext.jsx'
import { useCarga } from '../hooks/useCarga.js'

/**
 * Pantalla de listado con botón "Nuevo ..." (Usuarios y Ambientes comparten esta estructura). El mensaje de éxito con
 * que se vuelve de un formulario de registro (state.exito del router) se muestra como aviso y se quita del historial,
 * para que recargar la página no lo repita. Permite controles adicionales en cabecera y renderizado alternativo.
 */
export default function ListadoPage({
  titulo,
  resumen = null,
  textoNuevo,
  rutaNuevo,
  cargar,
  columnas,
  controles = null,
  renderContenido = null,
}) {
  const navigate = useNavigate()
  const { state, pathname } = useLocation()
  const { avisar } = useAvisos()
  const { datos, cargando, error, recargar } = useCarga(cargar)
  const avisadoRef = useRef(false)

  useEffect(() => {
    if (!state?.exito || avisadoRef.current) return
    avisadoRef.current = true
    avisar(state.exito)
    navigate(pathname, { replace: true, state: null })
  }, [state, avisar, navigate, pathname])

  return (
    <>
      <PageHeader
        titulo={titulo}
        subtitulo={!cargando && !error && resumen ? resumen(datos) : null}
        acciones={<Button onClick={() => navigate(rutaNuevo)}>{textoNuevo}</Button>}
      />
      {controles}
      {error && (
        <AlertMessage tipo="error">
          {error}{' '}
          <Button variante="enlace" onClick={recargar}>
            Reintentar
          </Button>
        </AlertMessage>
      )}
      {cargando ? (
        <EsqueletoDeLista texto={TEXTOS.cargando} />
      ) : (
        !error &&
        (renderContenido ? (
          renderContenido(datos)
        ) : (
          <TableList titulo={titulo} columnas={columnas} filas={datos} />
        ))
      )}
    </>
  )
}
