import { describe, expect, it } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import { AvisosProvider } from '../context/AvisosContext.jsx'
import { RESULTADO } from '../services/llamarApi.js'
import { useAccion } from './useAccion.js'

const conAvisos = ({ children }) => <AvisosProvider>{children}</AvisosProvider>

describe('useAccion: el éxito va a un aviso y el error se queda en la pantalla', () => {
  it('un éxito con mensaje se muestra como aviso y no deja alerta en la pantalla', async () => {
    function Prueba() {
      const { ejecutar, alerta } = useAccion()
      return (
        <>
          <button
            onClick={() =>
              ejecutar(async () => ({ tipo: RESULTADO.exito }), { mensajeExito: 'Guardado.' })
            }
          >
            ir
          </button>
          <p data-testid="alerta">{alerta ? alerta.mensaje : 'sin alerta'}</p>
        </>
      )
    }
    render(<Prueba />, { wrapper: conAvisos })
    await act(async () => screen.getByRole('button', { name: 'ir' }).click())
    expect(screen.getByTestId('alerta')).toHaveTextContent('sin alerta')
    expect(screen.getByRole('status')).toHaveTextContent('Guardado.')
  })

  it('un error queda en la alerta (se muestra donde ocurrió) y no crea aviso', async () => {
    const { result } = renderHook(() => useAccion(), { wrapper: conAvisos })
    await act(async () => {
      await result.current.ejecutar(async () => ({ tipo: RESULTADO.errorServidor }))
    })
    expect(result.current.alerta?.tipo).toBe('error')
  })
})
