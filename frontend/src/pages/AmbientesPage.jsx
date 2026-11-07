import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BarraDeOcupacion from '../components/ui/BarraDeOcupacion.jsx'
import Button from '../components/ui/Button.jsx'
import EstadoVacio from '../components/ui/EstadoVacio.jsx'
import { Icono } from '../components/ui/Icono.jsx'
import Insignia from '../components/ui/Insignia.jsx'
import TableList from '../components/ui/TableList.jsx'
import { TEXTOS } from '../constants/messages.js'
import { useCarga } from '../hooks/useCarga.js'
import { listarAmbientes, obtenerDisponibilidadDia } from '../services/recursosService.js'
import { porcentajeDeOcupacion } from '../utils/disponibilidad.js'
import { fechaAIso, hoy } from '../utils/fechas.js'
import { resumenDeAmbientes } from '../utils/resumenes.js'
import CeldaConDetalle from './CeldaConDetalle.jsx'
import CeldaDePersona from './CeldaDePersona.jsx'
import ListadoPage from './ListadoPage.jsx'
import estilos from './AmbientesPage.module.css'

const cargarOcupacionDeHoy = () => obtenerDisponibilidadDia(fechaAIso(hoy()))
const SIN_OCUPACION = null

const COLUMNAS_BASE = [
  {
    clave: 'nombre',
    titulo: 'Nombre',
    render: (ambiente) => <CeldaConDetalle principal={ambiente.nombre} detalle={ambiente.tipo} />,
  },
  { clave: 'capacidad', titulo: 'Capacidad', alineacion: 'derecha' },
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
    render: (ambiente) =>
      ambiente.responsableNombre ? <CeldaDePersona nombre={ambiente.responsableNombre} /> : '—',
  },
]

const columnas = (porAmbiente) =>
  COLUMNAS_BASE.flatMap((columna) =>
    columna.clave === 'responsableNombre'
      ? [
          {
            clave: 'ocupacion',
            titulo: 'Ocupación de hoy',
            render: (ambiente) => {
              const delDia = porAmbiente.get(ambiente.id)
              return (
                <BarraDeOcupacion
                  porcentaje={delDia ? porcentajeDeOcupacion(delDia) : null}
                  etiqueta={`Ocupación de hoy de ${ambiente.nombre}`}
                />
              )
            },
          },
          columna,
        ]
      : [columna],
  )

export default function AmbientesPage() {
  const navigate = useNavigate()
  const ocupacion = useCarga(cargarOcupacionDeHoy, SIN_OCUPACION)
  const [modoVista, setModoVista] = useState(() => {
    try {
      return localStorage.getItem('reservaupla.vistaAmbientes') || 'tabla'
    } catch {
      return 'tabla'
    }
  })

  const cambiarModo = (nuevoModo) => {
    setModoVista(nuevoModo)
    try {
      localStorage.setItem('reservaupla.vistaAmbientes', nuevoModo)
    } catch {
      // ignore
    }
  }

  const porAmbiente = new Map(
    (ocupacion.datos?.ambientes ?? []).map((ambiente) => [ambiente.id, ambiente]),
  )

  const controles = (
    <div className={estilos.barraSuperior}>
      <div className={estilos.alternadorVista} role="group" aria-label="Modo de visualización">
        <Button
          variante={modoVista === 'tarjetas' ? 'primario' : 'secundario'}
          className={estilos.botonAlternar}
          onClick={() => cambiarModo('tarjetas')}
          aria-pressed={modoVista === 'tarjetas'}
        >
          <Icono nombre="ambientes" tamano={16} />
          Tarjetas
        </Button>
        <Button
          variante={modoVista === 'tabla' ? 'primario' : 'secundario'}
          className={estilos.botonAlternar}
          onClick={() => cambiarModo('tabla')}
          aria-pressed={modoVista === 'tabla'}
        >
          <Icono nombre="calendario" tamano={16} />
          Tabla
        </Button>
      </div>
    </div>
  )

  const renderContenido = (datos) => {
    if (datos.length === 0) {
      return (
        <EstadoVacio mensaje={TEXTOS.noHayDatos}>
          <Button onClick={() => navigate('/ambientes/nuevo')}>{TEXTOS.nuevoAmbiente}</Button>
        </EstadoVacio>
      )
    }

    if (modoVista === 'tarjetas') {
      return (
        <div className={estilos.rejillaTarjetas} role="region" aria-label="Ambientes en tarjetas">
          {datos.map((ambiente) => {
            const delDia = porAmbiente.get(ambiente.id)
            const porcentaje = delDia ? porcentajeDeOcupacion(delDia) : null
            return (
              <article key={ambiente.id} className={estilos.tarjetaAmbiente}>
                <div className={estilos.tarjetaCabecera}>
                  <div className={estilos.iconoTipo} aria-hidden="true">
                    <Icono nombre={ambiente.tipo?.toLowerCase() || 'ambientes'} tamano={24} />
                  </div>
                  <div className={estilos.titulos}>
                    <h3 className={estilos.nombreAmbiente}>{ambiente.nombre}</h3>
                    <span className={estilos.tipoAmbiente}>{ambiente.tipo}</span>
                  </div>
                  <Insignia
                    tipo={ambiente.estado === 'Disponible' ? 'disponible' : 'mantenimiento'}
                  >
                    {ambiente.estado}
                  </Insignia>
                </div>
                <div className={estilos.tarjetaDetalles}>
                  <div className={estilos.detalleFila}>
                    <span className={estilos.detalleEtiqueta}>
                      <Icono nombre="usuarios" tamano={14} /> Capacidad
                    </span>
                    <span className={estilos.detalleValor}>{ambiente.capacidad} personas</span>
                  </div>
                  <div className={estilos.detalleFila}>
                    <span className={estilos.detalleEtiqueta}>
                      <Icono nombre="ambientes" tamano={14} /> Ubicación
                    </span>
                    <span className={estilos.detalleValor}>{ambiente.ubicacion}</span>
                  </div>
                  <div className={estilos.detalleFila}>
                    <span className={estilos.detalleEtiqueta}>
                      <Icono nombre="personas" tamano={14} /> Responsable
                    </span>
                    <span className={estilos.detalleValor}>
                      {ambiente.responsableNombre ? (
                        <CeldaDePersona nombre={ambiente.responsableNombre} />
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                </div>
                <div className={estilos.tarjetaOcupacion}>
                  <span className={estilos.ocupacionTitulo}>Ocupación de hoy:</span>
                  {ambiente.estado === 'Disponible' ? (
                    <BarraDeOcupacion
                      porcentaje={porcentaje}
                      etiqueta={`Ocupación de hoy de ${ambiente.nombre}`}
                    />
                  ) : (
                    <span className={estilos.ocupacionNula}>—</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )
    }

    return (
      <TableList titulo={TEXTOS.tituloAmbientes} columnas={columnas(porAmbiente)} filas={datos} />
    )
  }

  return (
    <ListadoPage
      titulo={TEXTOS.tituloAmbientes}
      textoNuevo={TEXTOS.nuevoAmbiente}
      rutaNuevo="/ambientes/nuevo"
      cargar={listarAmbientes}
      columnas={columnas(porAmbiente)}
      resumen={resumenDeAmbientes}
      controles={controles}
      renderContenido={renderContenido}
    />
  )
}
