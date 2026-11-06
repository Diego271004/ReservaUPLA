import { useState } from 'react'
import Insignia from '../components/ui/Insignia.jsx'
import TableList from '../components/ui/TableList.jsx'
import TextInput from '../components/ui/TextInput.jsx'
import { TEXTOS, textoSinUsuariosCoincidentes } from '../constants/messages.js'
import { NOMBRE_DE_ROL } from '../constants/navegacion.js'
import { listarUsuarios } from '../services/recursosService.js'
import { resumenDeUsuarios } from '../utils/resumenes.js'
import CeldaDePersona from './CeldaDePersona.jsx'
import ListadoPage from './ListadoPage.jsx'
import estilos from './UsuariosPage.module.css'

const cargarUsuarios = () => listarUsuarios()

const COLUMNAS = [
  {
    clave: 'nombreCompleto',
    titulo: 'Nombre completo',
    render: (usuario) => <CeldaDePersona nombre={usuario.nombreCompleto} />,
  },
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
  const [busqueda, setBusqueda] = useState('')

  const controles = (
    <div className={estilos.barraSuperior}>
      <div className={estilos.barraBusqueda}>
        <TextInput
          id="buscar-usuario"
          nombre="buscarUsuario"
          etiqueta={TEXTOS.buscarUsuarios}
          valor={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          ayuda={TEXTOS.ayudaBuscarUsuarios}
          autoComplete="off"
        />
      </div>
    </div>
  )

  const renderContenido = (datos) => {
    if (datos.length === 0) {
      return (
        <TableList
          titulo={TEXTOS.tituloUsuarios}
          columnas={COLUMNAS}
          filas={[]}
        />
      )
    }

    const termino = busqueda.trim().toLowerCase()
    const usuariosFiltrados = termino
      ? datos.filter((u) => {
          const nombre = (u.nombreCompleto ?? '').toLowerCase()
          const correo = (u.correo ?? '').toLowerCase()
          const rol = (NOMBRE_DE_ROL[u.rol] ?? u.rol ?? '').toLowerCase()
          return nombre.includes(termino) || correo.includes(termino) || rol.includes(termino)
        })
      : datos

    if (usuariosFiltrados.length === 0) {
      return (
        <p className={estilos.sinResultados}>
          {textoSinUsuariosCoincidentes(busqueda)}
        </p>
      )
    }

    return (
      <TableList
        titulo={TEXTOS.tituloUsuarios}
        columnas={COLUMNAS}
        filas={usuariosFiltrados}
      />
    )
  }

  return (
    <ListadoPage
      titulo={TEXTOS.tituloUsuarios}
      textoNuevo={TEXTOS.nuevoUsuario}
      rutaNuevo="/usuarios/nuevo"
      cargar={cargarUsuarios}
      columnas={COLUMNAS}
      resumen={resumenDeUsuarios}
      controles={controles}
      renderContenido={renderContenido}
    />
  )
}
