import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from './Avatar.jsx'
import BarraDeOcupacion from './BarraDeOcupacion.jsx'
import EstadoVacio from './EstadoVacio.jsx'
import PageHeader from './PageHeader.jsx'

describe('PageHeader: la cabecera común de las pantallas', () => {
  it('muestra el título como h1, el subtítulo y las acciones', () => {
    render(
      <PageHeader
        titulo="Reservas"
        subtitulo="6 reservas · 2 pendientes"
        acciones={<button>Ir</button>}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Reservas' })).toBeInTheDocument()
    expect(screen.getByText('6 reservas · 2 pendientes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir' })).toBeInTheDocument()
  })

  it('sin subtítulo ni acciones solo trae el título', () => {
    const { container } = render(<PageHeader titulo="Ambientes" />)
    expect(container.querySelectorAll('p')).toHaveLength(0)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('puede llevar un id en el título (para aria-labelledby)', () => {
    render(<PageHeader titulo="Detalle" idTitulo="titulo-x" />)
    expect(screen.getByRole('heading', { name: 'Detalle' })).toHaveAttribute('id', 'titulo-x')
  })
})

describe('Avatar', () => {
  it('muestra las iniciales y es decorativo', () => {
    render(<Avatar nombre="Carla Rojas Díaz" />)
    expect(screen.getByText('CR')).toHaveAttribute('aria-hidden', 'true')
  })

  it('con un nombre vacío no muestra nada', () => {
    render(<Avatar nombre="" />)
    expect(document.querySelector('span').textContent).toBe('')
  })
})

describe('BarraDeOcupacion', () => {
  it('dice el porcentaje en su nombre accesible', () => {
    render(<BarraDeOcupacion porcentaje={45} etiqueta="Ocupación de hoy de Auditorio" />)
    expect(
      screen.getByRole('img', { name: 'Ocupación de hoy de Auditorio: 45 %' }),
    ).toBeInTheDocument()
    expect(screen.getByText('45 %')).toHaveAttribute('aria-hidden', 'true')
  })

  it('el relleno tiene el ancho del porcentaje', () => {
    const { container } = render(<BarraDeOcupacion porcentaje={20} etiqueta="x" />)
    expect(container.querySelector('[style]').style.width).toBe('20%')
  })

  it('con 0 % la barra está vacía pero se sigue mostrando', () => {
    render(<BarraDeOcupacion porcentaje={0} etiqueta="x" />)
    expect(screen.getByRole('img', { name: 'x: 0 %' })).toBeInTheDocument()
  })

  it.each([null, undefined])('con %s muestra «—» y no hay barra', (valor) => {
    render(<BarraDeOcupacion porcentaje={valor} etiqueta="x" />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('EstadoVacio', () => {
  it('muestra el mensaje, una ilustración decorativa y el siguiente paso', () => {
    const { container } = render(
      <EstadoVacio mensaje="No hay reservas.">
        <button>Reservar</button>
      </EstadoVacio>,
    )
    expect(screen.getByText('No hay reservas.')).toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeInTheDocument()
  })

  it('la ilustración SVG es puramente decorativa: aria-hidden="true", focusable="false" y sin controles interactivos', () => {
    const { container } = render(<EstadoVacio mensaje="Sin datos disponibles." />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(svg.querySelectorAll('button, a, input, [tabindex]')).toHaveLength(0)
  })

  it('admite la variante compacta con dimensiones reducidas para tablas y listas', () => {
    const { container } = render(<EstadoVacio mensaje="Sin registros." compacto />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '64')
    expect(svg).toHaveAttribute('height', '46')
  })
})

describe('EstadoVacio sin mensaje (paginas de error)', () => {
  it('no pinta un parrafo vacio y conserva la ilustracion y el siguiente paso', () => {
    const { container } = render(
      <EstadoVacio>
        <a href="/">Volver al inicio</a>
      </EstadoVacio>,
    )
    expect(container.querySelectorAll('p')).toHaveLength(0)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeInTheDocument()
  })
})
