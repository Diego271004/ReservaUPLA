import { TEXTOS } from '../../constants/messages.js'
import { TEMAS, useTema } from '../../hooks/useTema.js'
import Button from './Button.jsx'
import { Icono } from './Icono.jsx'

/**
 * Botón de la barra superior y del login que cambia entre el modo claro y el oscuro. Muestra la luna en claro y el sol en oscuro, y su
 * nombre dice a qué modo cambia (sin aria-pressed: el nombre ya cambia con el estado). Cuadrado de 44 px.
 */
export default function InterruptorDeTema({ className = '' }) {
  const [tema, alternar] = useTema()
  const oscuro = tema === TEMAS.oscuro
  const nombre = oscuro ? TEXTOS.cambiarAModoClaro : TEXTOS.cambiarAModoOscuro

  return (
    <Button
      variante="icono"
      className={className}
      aria-label={nombre}
      title={nombre}
      onClick={alternar}
    >
      <Icono nombre={oscuro ? 'sol' : 'luna'} tamano={20} />
    </Button>
  )
}
