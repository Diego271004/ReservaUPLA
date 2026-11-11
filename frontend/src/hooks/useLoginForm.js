import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RUTA_INICIAL_POR_ROL } from '../constants/navegacion.js'
import { MENSAJES } from '../constants/messages.js'
import { useAuth } from '../context/AuthContext.jsx'
import { login } from '../services/authService.js'
import { normalizarCorreo, validarLogin } from '../utils/validators.js'
import { useFormulario } from './useFormulario.js'

const VALORES_INICIALES = { correo: '', contrasena: '' }

export function useLoginForm() {
  const navigate = useNavigate()
  const { iniciarSesion } = useAuth()
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [bloqMayusActivo, setBloqMayusActivo] = useState(false)
  const [ayudaSoporteVisible, setAyudaSoporteVisible] = useState(false)

  const enviar = useCallback(
    (valores, { signal }) =>
      login(normalizarCorreo(valores.correo), valores.contrasena, { signal }),
    [],
  )

  const alExito = useCallback(
    (sesion) => {
      iniciarSesion(sesion)
      navigate(RUTA_INICIAL_POR_ROL[sesion.rol] ?? '/', { replace: true })
    },
    [iniciarSesion, navigate],
  )

  const manejarResultado = useCallback(
    (resultado, { terminar, setAlerta, setValores, enfocar }) => {
      if (resultado.tipo !== 'credencialesInvalidas') return false
      terminar()
      setAlerta({ tipo: 'error', mensaje: MENSAJES.credencialesInvalidas })
      setValores((previos) => ({ ...previos, contrasena: '' }))
      enfocar('contrasena')
      return true
    },
    [],
  )

  const formulario = useFormulario({
    valoresIniciales: VALORES_INICIALES,
    validar: validarLogin,
    enviar,
    alExito,
    manejarResultado,
  })

  const { handleBlur } = formulario
  const handleBlurLogin = useCallback(
    (evento) => {
      if (evento.target.name === 'contrasena') setBloqMayusActivo(false)
      handleBlur(evento)
    },
    [handleBlur],
  )

  const handleBloqMayus = useCallback((evento) => {
    if (typeof evento.getModifierState === 'function') {
      setBloqMayusActivo(evento.getModifierState('CapsLock'))
    }
  }, [])

  return {
    ...formulario,
    handleBlur: handleBlurLogin,
    mostrarContrasena,
    bloqMayusActivo,
    ayudaSoporteVisible,
    handleBloqMayus,
    alternarMostrarContrasena: () => setMostrarContrasena((visible) => !visible),
    alternarAyudaSoporte: () => setAyudaSoporteVisible((visible) => !visible),
  }
}
