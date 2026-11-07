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

  it('con empate muestra el texto «Empate: N ambientes con M reservas aprobadas» y los nombres como chips', () => {
    render(
      <GrupoDeIndicadores
        indicadores={[
          {
            clave: 'uso',
            valor: 'Empate: 2 ambientes con 3 reservas aprobadas',
            descripcion: 'Ambiente más utilizado',
            detalle: '3 reservas aprobadas cada uno',
            chips: ['Auditorio Principal', 'Laboratorio de Cómputo 2'],
            ancha: true,
          },
        ]}
      />,
    )

    expect(screen.getByText('Empate: 2 ambientes con 3 reservas aprobadas')).toBeInTheDocument()
    expect(screen.getByText('3 reservas aprobadas cada uno')).toBeInTheDocument()

    const chipsRegion = screen.getByLabelText('Ambientes en empate')
    expect(chipsRegion).toBeInTheDocument()
    expect(within(chipsRegion).getByText('Auditorio Principal')).toBeInTheDocument()
    expect(within(chipsRegion).getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
  })

  it('sin empate muestra el nombre del ambiente único como valor principal sin chips', () => {
    render(
      <GrupoDeIndicadores
        indicadores={[
          {
            clave: 'uso',
            valor: 'Auditorio Principal',
            descripcion: 'Ambiente más utilizado',
            detalle: '14 reservas aprobadas',
            chips: null,
            ancha: true,
          },
        ]}
      />,
    )

    expect(screen.getByText('Auditorio Principal')).toBeInTheDocument()
    expect(screen.getByText('14 reservas aprobadas')).toBeInTheDocument()
    expect(screen.queryByLabelText('Ambientes en empate')).not.toBeInTheDocument()
  })
})
