import Insignia from '../components/ui/Insignia.jsx'
import { TEXTOS } from '../constants/messages.js'
import { listarAmbientes } from '../services/recursosService.js'
import ListadoPage from './ListadoPage.jsx'

const COLUMNAS = [
  { clave: 'nombre', titulo: 'Nombre' },
  { clave: 'tipo', titulo: 'Tipo' },
  { clave: 'capacidad', titulo: 'Capacidad' },
  { clave: 'ubicacion', titulo: 'Ubicación' },
  {
    clave: 'estado',
    titulo: 'Estado',
    render: (ambiente) =>
      ambiente.estado === 'Disponible' ? (
        <Insignia tipo="disponible">{ambiente.estado}</Insignia>
      ) : (
        <Insignia tipo="mantenimiento">{ambiente.estado}</Insignia>
      ),
  },
  {
    clave: 'responsableNombre',
    titulo: 'Responsable',
    render: (ambiente) => ambiente.responsableNombre ?? '—',
  },
]

export default function AmbientesPage() {
  return (
    <ListadoPage
      titulo={TEXTOS.tituloAmbientes}
      textoNuevo={TEXTOS.nuevoAmbiente}
      rutaNuevo="/ambientes/nuevo"
      cargar={listarAmbientes}
      columnas={COLUMNAS}
    />
  )
}
