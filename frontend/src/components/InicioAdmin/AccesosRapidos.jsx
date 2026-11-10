import { Link } from 'react-router-dom'
import { Icono } from '../ui/Icono.jsx'
import { TEXTOS } from '../../constants/messages.js'
import estilos from './AccesosRapidos.module.css'

const ACCESOS = [
  { ruta: '/reservas/nueva', icono: 'nuevaReserva', texto: TEXTOS.tituloNuevaReserva },
  { ruta: '/disponibilidad', icono: 'calendario', texto: TEXTOS.accesoVerDisponibilidad },
  { ruta: '/ambientes/nuevo', icono: 'ambientes', texto: TEXTOS.nuevoAmbiente },
  { ruta: '/usuarios/nuevo', icono: 'usuarios', texto: TEXTOS.nuevoUsuario },
]

/** Los cuatro atajos del Administrador: lo que más hace desde el Inicio, a un clic (menos pasos: Shneiderman 2 y 8). */
export default function AccesosRapidos() {
  return (
    <nav className={estilos.accesos} aria-label={TEXTOS.accesosRapidos}>
      {ACCESOS.map(({ ruta, icono, texto }) => (
        <Link key={ruta} to={ruta} className={estilos.acceso}>
          <Icono nombre={icono} tamano={18} />
          {texto}
        </Link>
      ))}
    </nav>
  )
}
