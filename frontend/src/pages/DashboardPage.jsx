import { useNavigate } from 'react-router-dom'
import { TEXTOS } from '../constants/messages.js'
import { useAuth } from '../context/AuthContext.jsx'
import InicioAdministrador from './InicioAdministrador.jsx'
import InicioResponsable from './InicioResponsable.jsx'
import InicioSolicitante from './InicioSolicitante.jsx'
import { saludoContextual } from '../utils/saludo.js'
import Button from '../components/ui/Button.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

export default function DashboardPage({ ahora = new Date() }) {
  const navigate = useNavigate()
  const { sesion } = useAuth()
  const rol = sesion?.rol

  return (
    <>
      <PageHeader
        titulo={TEXTOS.tituloDashboard}
        subtitulo={saludoContextual(sesion?.nombreCompleto)}
        acciones={
          rol === 'Solicitante' ? (
            <Button onClick={() => navigate('/reservas/nueva')}>Reservar un ambiente</Button>
          ) : null
        }
      />
      {rol === 'Administrador' && <InicioAdministrador ahora={ahora} />}
      {rol === 'Solicitante' && <InicioSolicitante ahora={ahora} />}
      {(rol === 'Responsable de ambiente' || rol === 'Responsable') && (
        <InicioResponsable
          ahora={ahora}
          alVerDetalle={(id) => navigate(`/reservas/${id}`, { state: { volverA: '/dashboard' } })}
        />
      )}
    </>
  )
}
