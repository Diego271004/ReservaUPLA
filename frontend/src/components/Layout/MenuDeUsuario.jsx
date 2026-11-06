import { useEffect, useId, useRef, useState } from 'react'
import { NOMBRE_DE_ROL } from '../../constants/navegacion.js'
import { TEXTOS } from '../../constants/messages.js'
import { iniciales } from '../../utils/personas.js'
import Button from '../ui/Button.jsx'
import { Icono } from '../ui/Icono.jsx'
import estilos from './MenuDeUsuario.module.css'

/**
 * Menú de usuario de la barra superior: avatar con iniciales, nombre y rol, y al abrirlo «Cerrar sesión». Es un botón que
 * despliega un panel (no un role="menu"): Escape lo cierra devolviendo el foco, y también un clic fuera o salir con Tab.
 */
export default function MenuDeUsuario({ sesion, alCerrarSesion }) {
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef(null)
  const idPanel = useId()
  const rol = NOMBRE_DE_ROL[sesion.rol] ?? sesion.rol

  useEffect(() => {
    if (!abierto) return undefined
    const alHacerClic = (evento) => {
      if (!contenedorRef.current.contains(evento.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', alHacerClic)
    return () => document.removeEventListener('mousedown', alHacerClic)
  }, [abierto])

  const alPulsarTecla = (evento) => {
    if (evento.key !== 'Escape' || !abierto) return
    setAbierto(false)
    contenedorRef.current.querySelector('button').focus()
  }
  const alPerderElFoco = (evento) => {
    if (!contenedorRef.current.contains(evento.relatedTarget)) setAbierto(false)
  }

  return (
    <div
      ref={contenedorRef}
      className={estilos.contenedor}
      onKeyDown={alPulsarTecla}
      onBlur={alPerderElFoco}
    >
      <Button
        variante="usuario"
        aria-expanded={abierto}
        aria-controls={abierto ? idPanel : undefined}
        aria-label={`${sesion.nombreCompleto}, ${rol}`}
        onClick={() => setAbierto((actual) => !actual)}
      >
        <span className={estilos.avatar} aria-hidden="true">
          {iniciales(sesion.nombreCompleto)}
        </span>
        <span className={estilos.datos}>
          <span className={estilos.nombre}>{sesion.nombreCompleto}</span>
          <span className={estilos.rol}>{rol}</span>
        </span>
        <Icono nombre="flecha" />
      </Button>
      {abierto && (
        <div id={idPanel} className={estilos.panel}>
          <div className={estilos.persona}>
            <p className={estilos.nombrePanel}>{sesion.nombreCompleto}</p>
            <p className={estilos.rolPanel}>{rol}</p>
          </div>
          <Button variante="filaDeMenu" onClick={alCerrarSesion}>
            <Icono nombre="salir" tamano={18} />
            {TEXTOS.cerrarSesion}
          </Button>
        </div>
      )}
    </div>
  )
}
