import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import AlertMessage from './AlertMessage.jsx'
import Button from './Button.jsx'
import CardIndicador from './CardIndicador.jsx'
import InterruptorActivo from './InterruptorActivo.jsx'
import Insignia from './Insignia.jsx'
import ModalConfirmacion from './ModalConfirmacion.jsx'
import TableList from './TableList.jsx'

describe('Button', () => {
  it('habilitado: responde al clic y a Enter y Espacio', async () => {
    const alHacerClic = vi.fn()
    render(<Button onClick={alHacerClic}>Guardar</Button>)
    const boton = screen.getByRole('button', { name: 'Guardar' })
    await userEvent.click(boton)
    boton.focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(alHacerClic).toHaveBeenCalledTimes(3)
  })

  it('deshabilitado: no responde y no se enfoca', async () => {
    const alHacerClic = vi.fn()
    render(
      <Button deshabilitado onClick={alHacerClic}>
        Guardar
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await userEvent.tab()
    expect(alHacerClic).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('carga: muestra el texto de carga, queda ocupado, conserva el foco y no repite la acción', async () => {
    const alHacerClic = vi.fn()
    render(
      <Button cargando textoCarga="Guardando…" onClick={alHacerClic}>
        Guardar
      </Button>,
    )
    const boton = screen.getByRole('button', { name: 'Guardando…' })
    expect(boton).toHaveAttribute('aria-busy', 'true')
    expect(boton).not.toBeDisabled()
    await userEvent.tab()
    expect(boton).toHaveFocus()
    await userEvent.click(boton)
    expect(alHacerClic).not.toHaveBeenCalled()
  })

  it.each(['primario', 'secundario', 'rechazar', 'confirmarRechazo', 'enlace'])(
    'la variante %s se muestra',
    (variante) => {
      render(<Button variante={variante}>Acción</Button>)
      expect(screen.getByRole('button', { name: 'Acción' })).toBeInTheDocument()
    },
  )

  it.each(['sobreOscuro', 'sobreOscuroLista'])(
    'la variante %s (menú lateral) se muestra, responde y pasa los atributos de accesibilidad',
    async (variante) => {
      const alHacerClic = vi.fn()
      render(
        <Button
          variante={variante}
          aria-expanded={false}
          aria-controls="menu-principal"
          onClick={alHacerClic}
        >
          Menú
        </Button>,
      )
      const boton = screen.getByRole('button', { name: 'Menú' })
      expect(boton).toHaveAttribute('aria-expanded', 'false')
      expect(boton).toHaveAttribute('aria-controls', 'menu-principal')
      expect(boton.className).toContain(variante)
      await userEvent.click(boton)
      expect(alHacerClic).toHaveBeenCalledTimes(1)
    },
  )

  it('de tipo submit envía el formulario', async () => {
    const alEnviar = vi.fn((e) => e.preventDefault())
    render(
      <form onSubmit={alEnviar}>
        <Button tipo="submit">Enviar</Button>
      </form>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(alEnviar).toHaveBeenCalledTimes(1)
  })

  it('en carga un botón submit no envía otra vez', async () => {
    const alEnviar = vi.fn((e) => e.preventDefault())
    render(
      <form onSubmit={alEnviar}>
        <Button tipo="submit" cargando>
          Enviar
        </Button>
      </form>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(alEnviar).not.toHaveBeenCalled()
  })
})

describe('AlertMessage', () => {
  it('error: usa role alert y el icono único de error', () => {
    const { container } = render(<AlertMessage tipo="error">Algo salió mal.</AlertMessage>)
    expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal.')
    expect(container.querySelector('[data-icono="error"]')).toBeInTheDocument()
  })

  it.each(['exito', 'aviso', 'info'])('%s: usa role status con icono y texto', (tipo) => {
    const { container } = render(<AlertMessage tipo={tipo}>Mensaje</AlertMessage>)
    expect(screen.getByRole('status')).toHaveTextContent('Mensaje')
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.querySelector('[data-icono="error"]')).not.toBeInTheDocument()
  })
})

describe('ModalConfirmacion', () => {
  function Prueba({ alConfirmar = () => {}, alVolver = () => {}, cargando = false }) {
    const [abierto, setAbierto] = useState(false)
    return (
      <>
        <button onClick={() => setAbierto(true)}>Abrir</button>
        <ModalConfirmacion
          abierto={abierto}
          titulo="¿Rechazar esta reserva?"
          resumen={['Ambiente: Laboratorio de Cómputo 2', 'Horario: 05/11/2026, 10:00 – 12:00']}
          textoConfirmar="Sí, rechazar"
          variante="rechazo"
          cargando={cargando}
          onConfirmar={alConfirmar}
          onVolver={() => {
            alVolver()
            setAbierto(false)
          }}
        />
      </>
    )
  }

  it('cerrado: no muestra nada', () => {
    render(<Prueba />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('abrir: muestra título y resumen, y el foco va a Volver (la opción segura)', async () => {
    render(<Prueba />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    const dialogo = screen.getByRole('dialog', { name: '¿Rechazar esta reserva?' })
    expect(dialogo).toHaveAccessibleDescription(/Laboratorio de Cómputo 2/)
    expect(within(dialogo).getByText('Horario: 05/11/2026, 10:00 – 12:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver' })).toHaveFocus()
  })

  it('confirmar: llama a onConfirmar', async () => {
    const alConfirmar = vi.fn()
    render(<Prueba alConfirmar={alConfirmar} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, rechazar' }))
    expect(alConfirmar).toHaveBeenCalledTimes(1)
  })

  it('volver: cierra y el foco regresa al botón que lo abrió', async () => {
    const alVolver = vi.fn()
    render(<Prueba alVolver={alVolver} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(alVolver).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus()
  })

  it('Escape equivale a Volver', async () => {
    const alVolver = vi.fn()
    render(<Prueba alVolver={alVolver} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    await userEvent.keyboard('{Escape}')
    expect(alVolver).toHaveBeenCalledTimes(1)
  })

  it('Tab no sale del cuadro: cicla entre Volver y confirmar', async () => {
    render(<Prueba />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Sí, rechazar' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Volver' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Sí, rechazar' })).toHaveFocus()
  })

  it('carga: el botón de confirmar muestra "Guardando…" y no repite la acción', async () => {
    const alConfirmar = vi.fn()
    render(<Prueba alConfirmar={alConfirmar} cargando />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardando…' }))
    expect(alConfirmar).not.toHaveBeenCalled()
  })
})

describe('TableList e Insignia', () => {
  const columnas = [
    { clave: 'ambiente', titulo: 'Ambiente' },
    {
      clave: 'estado',
      titulo: 'Estado',
      render: (fila) => <Insignia tipo="aprobada">{fila.estado}</Insignia>,
    },
  ]
  const filas = [
    { id: 1, ambiente: 'Laboratorio de Cómputo 2', estado: 'Aprobada' },
    { id: 2, ambiente: 'Auditorio Principal', estado: 'Aprobada' },
  ]

  it('muestra encabezados, filas y la insignia con icono y texto', () => {
    const { container } = render(<TableList titulo="Reservas" columnas={columnas} filas={filas} />)
    expect(screen.getByRole('table', { name: 'Reservas' })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Ambiente',
      'Estado',
    ])
    expect(screen.getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(screen.getAllByText('Aprobada')).toHaveLength(2)
    expect(container.querySelectorAll('tbody svg')).toHaveLength(2)
  })

  it('cada celda lleva su título para la vista de tarjetas en móvil', () => {
    render(<TableList titulo="Reservas" columnas={columnas} filas={filas} />)
    expect(screen.getByText('Auditorio Principal')).toHaveAttribute('data-etiqueta', 'Ambiente')
  })

  it('estado vacío: muestra el texto en lugar de filas', () => {
    render(
      <TableList titulo="Reservas" columnas={columnas} filas={[]} textoVacio="No hay reservas." />,
    )
    expect(screen.getByText('No hay reservas.')).toBeInTheDocument()
  })

  it.each([
    'pendiente',
    'aprobada',
    'rechazada',
    'cancelada',
    'activo',
    'inactivo',
    'disponible',
    'mantenimiento',
  ])('la insignia %s lleva icono y texto', (tipo) => {
    const { container } = render(<Insignia tipo={tipo}>Texto</Insignia>)
    expect(screen.getByText('Texto')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('CardIndicador', () => {
  it('muestra el número y la descripción', () => {
    render(<CardIndicador valor="48" descripcion="Total de reservas" />)
    expect(screen.getByText('48')).toBeInTheDocument()
    expect(screen.getByText('Total de reservas')).toBeInTheDocument()
  })

  it('un texto largo se conserva completo (parte en dos líneas, no se corta con "…")', () => {
    render(
      <CardIndicador
        valor="Laboratorio de Cómputo 2"
        descripcion="Ambiente más utilizado"
        detalle="14 reservas"
      />,
    )
    expect(screen.getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(screen.getByText('14 reservas')).toBeInTheDocument()
  })
})

describe('InterruptorActivo', () => {
  function Controlado({ inicial = true, deshabilitado = false }) {
    const [activo, setActivo] = useState(inicial)
    return (
      <InterruptorActivo
        id="activo"
        nombre="activo"
        etiqueta="Activo"
        activo={activo}
        deshabilitado={deshabilitado}
        onChange={(e) => setActivo(e.target.checked)}
      />
    )
  }

  it('encendido muestra "Activo" y apagado muestra "Inactivo" (texto, no solo color)', async () => {
    render(<Controlado />)
    const interruptor = screen.getByRole('switch', { name: 'Activo' })
    expect(interruptor).toBeChecked()
    expect(screen.getAllByText('Activo').length).toBeGreaterThan(0)
    await userEvent.click(interruptor)
    expect(interruptor).not.toBeChecked()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('se opera con el teclado: Tab y Espacio', async () => {
    render(<Controlado />)
    await userEvent.tab()
    expect(screen.getByRole('switch')).toHaveFocus()
    await userEvent.keyboard(' ')
    expect(screen.getByRole('switch')).not.toBeChecked()
  })

  it('deshabilitado: no cambia', async () => {
    render(<Controlado deshabilitado />)
    await userEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('switch')).toBeChecked()
  })
})
