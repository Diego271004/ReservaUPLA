import Insignia from '../components/ui/Insignia.jsx'
import { TEXTOS } from '../constants/messages.js'
import { NOMBRE_DE_ROL } from '../constants/navegacion.js'
import { listarUsuarios } from '../services/recursosService.js'
import ListadoPage from './ListadoPage.jsx'

// Funciones estables (fuera del componente) para que useCarga no vuelva a cargar en cada render.
const cargarUsuarios = () => listarUsuarios()

const COLUMNAS = [
  { clave: 'nombreCompleto', titulo: 'Nombre completo' },
  { clave: 'correo', titulo: 'Correo' },
  { clave: 'rol', titulo: 'Rol', render: (usuario) => NOMBRE_DE_ROL[usuario.rol] ?? usuario.rol },
  {
    clave: 'activo',
    titulo: 'Estado',
    render: (usuario) =>
      usuario.activo ? (
        <Insignia tipo="activo">{TEXTOS.activo}</Insignia>
      ) : (
        <Insignia tipo="inactivo">{TEXTOS.inactivo}</Insignia>
      ),
  },
]

export default function UsuariosPage() {
  return (
    <ListadoPage
      titulo={TEXTOS.tituloUsuarios}
      textoNuevo={TEXTOS.nuevoUsuario}
      rutaNuevo="/usuarios/nuevo"
      cargar={cargarUsuarios}
      columnas={COLUMNAS}
    />
  )
}
