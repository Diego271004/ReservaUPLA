import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import GrupoDeIndicadores from './GrupoDeIndicadores.jsx'

describe('GrupoDeIndicadores', () => {
  it('dibuja una tarjeta por indicador dentro de la región «Indicadores»', () => {
    render(
      <GrupoDeIndicadores
        indicadores={[
          {
            clave: 'total',
            valor: 48,
            descripcion: 'Total de reservas',
            detalle: 'Incluye canceladas',
          },
          { clave: 'uso', valor: 'Auditorio Principal', descripcion: 'Ambiente más utilizado' },
        ]}
      />,
    )
    const tarjetas = within(screen.getByRole('region', { name: 'Indicadores' })).getAllByRole(
      'article',
    )
    expect(tarjetas).toHaveLength(2)
    expect(tarjetas[0]).toHaveTextContent('48Total de reservasIncluye canceladas')
    expect(tarjetas[1]).toHaveTextContent('Auditorio PrincipalAmbiente más utilizado')
  })
})
