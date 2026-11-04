import { Icono } from './Icono.jsx'
import estilos from './Insignia.module.css'

// Un solo estilo de insignia para todo el sistema: cápsula con icono de 16 px y texto en una línea.
const ICONO_POR_TIPO = {
  pendiente: 'reloj',
  aprobada: 'marca',
  rechazada: 'equis',
  cancelada: 'menos',
  activo: 'punto',
  inactivo: 'punto',
  disponible: 'marca',
  mantenimiento: 'aviso',
}

const CLASE_POR_TIPO = {
  pendiente: 'aviso',
  aprobada: 'exito',
  rechazada: 'error',
  cancelada: 'neutro',
  activo: 'exito',
  inactivo: 'neutro',
  disponible: 'exito',
  mantenimiento: 'aviso',
}

export default function Insignia({ tipo, children }) {
  return (
    <span className={`${estilos.insignia} ${estilos[CLASE_POR_TIPO[tipo]]}`}>
      <Icono nombre={ICONO_POR_TIPO[tipo]} className={estilos.icono} />
      {children}
    </span>
  )
}
