import { useState } from 'react'
import { TEXTOS } from '../../constants/messages.js'
import { validarFiltros } from '../../utils/filtrosDeReservas.js'
import Button from '../ui/Button.jsx'
import DateInput from '../ui/DateInput.jsx'
import SelectInput from '../ui/SelectInput.jsx'
import estilos from './FiltrosDeReservas.module.css'

const OPCIONES_ESTADO = ['Pendiente', 'Aprobada', 'Rechazada', 'Cancelada'].map((valor) => ({
  valor,
  etiqueta: valor,
}))

/**
 * Los filtros de la lista de Reservas: Estado, Ambiente y las fechas desde/hasta, con «Aplicar filtros» y «Limpiar».
 * Lo que se escribe es un borrador: solo se aplica al pulsar «Aplicar filtros» (o Enter) y si las fechas son válidas.
 * La pantalla lo vuelve a montar con otra `key` cuando cambian los filtros aplicados (atrás/adelante, «Ver todas»).
 */
export default function FiltrosDeReservas({ aplicados, ambientes, alAplicar, alLimpiar }) {
  const [borrador, setBorrador] = useState({
    estado: aplicados.estado,
    ambienteId: aplicados.ambienteId,
    desde: aplicados.desde,
    hasta: aplicados.hasta,
  })
  const [errores, setErrores] = useState({ desde: null, hasta: null })

  const cambiar = (evento) => {
    const { name, value } = evento.target
    setBorrador((previo) => ({ ...previo, [name]: value }))
    setErrores((previos) => ({ ...previos, [name]: null }))
  }

  const aplicar = (evento) => {
    evento.preventDefault()
    const encontrados = validarFiltros(borrador)
    setErrores(encontrados)
    if (!encontrados.desde && !encontrados.hasta) alAplicar(borrador)
  }

  return (
    <form className={estilos.filtros} onSubmit={aplicar} noValidate aria-label={TEXTOS.filtros}>
      <div className={estilos.campos}>
        <SelectInput
          id="filtro-estado"
          nombre="estado"
          etiqueta={TEXTOS.etiquetaFiltroEstado}
          valor={borrador.estado}
          opciones={OPCIONES_ESTADO}
          textoVacio={TEXTOS.todos}
          onChange={cambiar}
        />
        <SelectInput
          id="filtro-ambienteId"
          nombre="ambienteId"
          etiqueta={TEXTOS.etiquetaFiltroAmbiente}
          valor={borrador.ambienteId}
          opciones={ambientes}
          textoVacio={TEXTOS.todos}
          onChange={cambiar}
        />
        <DateInput
          id="filtro-desde"
          nombre="desde"
          etiqueta={TEXTOS.etiquetaFechaDesde}
          valor={borrador.desde}
          ayuda={TEXTOS.ayudaFechaFiltro}
          error={errores.desde}
          onChange={cambiar}
        />
        <DateInput
          id="filtro-hasta"
          nombre="hasta"
          etiqueta={TEXTOS.etiquetaFechaHasta}
          valor={borrador.hasta}
          ayuda={TEXTOS.ayudaFechaFiltro}
          error={errores.hasta}
          onChange={cambiar}
        />
      </div>
      <div className={estilos.acciones}>
        <Button variante="secundario" onClick={alLimpiar}>
          {TEXTOS.limpiar}
        </Button>
        <Button tipo="submit">{TEXTOS.aplicarFiltros}</Button>
      </div>
    </form>
  )
}
