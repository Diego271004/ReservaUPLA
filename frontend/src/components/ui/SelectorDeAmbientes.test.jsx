import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelectorDeAmbientes from './SelectorDeAmbientes.jsx'

const AMBIENTES_EJEMPLO = [
  {
    id: 1,
    nombre: 'Laboratorio de Cómputo 2',
    tipo: 'Laboratorio',
    capacidad: 30,
    ubicacion: 'Pabellón A, piso 2',
    estado: 'Disponible',
  },
  {
    id: 2,
    nombre: 'Auditorio Principal',
    tipo: 'Auditorio',
    capacidad: 200,
    ubicacion: 'Pabellón B, piso 1',
    estado: 'Disponible',
  },
  {
    id: 3,
    nombre: 'Sala de Reuniones A',
    tipo: 'Sala',
    capacidad: 12,
    ubicacion: 'Pabellón A, piso 3',
    estado: 'En mantenimiento',
  },
]

describe('SelectorDeAmbientes (tarjetas seleccionables accesibles)', () => {
  it('renderiza el radiogroup con su etiqueta y cada ambiente como tarjeta radio', () => {
    render(
      <SelectorDeAmbientes
        id="ambienteId"
        nombre="ambienteId"
        etiqueta="Ambiente"
        ambientes={AMBIENTES_EJEMPLO}
        valor=""
        onChange={vi.fn()}
      />,
    )

    const grupo = screen.getByRole('radiogroup', { name: 'Ambiente' })
    expect(grupo).toBeInTheDocument()

    const radios = within(grupo).getAllByRole('radio')
    expect(radios).toHaveLength(3)

    // Primera tarjeta: Disponible
    expect(radios[0]).toHaveAttribute('aria-label', 'Laboratorio de Cómputo 2')
    expect(within(radios[0]).getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(within(radios[0]).getByText('30 personas · Pabellón A, piso 2')).toBeInTheDocument()
    expect(within(radios[0]).getByText('Disponible')).toBeInTheDocument()

    // Tercera tarjeta: En mantenimiento
    expect(radios[2]).toHaveAttribute(
      'aria-label',
      'Sala de Reuniones A · En mantenimiento (no disponible)',
    )
    expect(radios[2]).toHaveAttribute('aria-disabled', 'true')
    expect(within(radios[2]).getByText('En mantenimiento (no disponible)')).toBeInTheDocument()
  })

  it('un clic en un ambiente disponible llama a onChange con su id', async () => {
    const alCambiar = vi.fn()
    render(
      <SelectorDeAmbientes
        id="ambienteId"
        nombre="ambienteId"
        etiqueta="Ambiente"
        ambientes={AMBIENTES_EJEMPLO}
        valor=""
        onChange={alCambiar}
      />,
    )

    await userEvent.click(screen.getByRole('radio', { name: /Auditorio Principal/ }))
    expect(alCambiar).toHaveBeenCalledWith({
      target: { name: 'ambienteId', value: '2' },
    })
  })

  it('un clic en un ambiente en mantenimiento no llama a onChange', async () => {
    const alCambiar = vi.fn()
    render(
      <SelectorDeAmbientes
        id="ambienteId"
        nombre="ambienteId"
        etiqueta="Ambiente"
        ambientes={AMBIENTES_EJEMPLO}
        valor=""
        onChange={alCambiar}
      />,
    )

    await userEvent.click(screen.getByRole('radio', { name: /Sala de Reuniones A/ }))
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('roving tabindex: sin selección el primer habilitado tiene tabIndex=0; con selección solo el elegido tiene 0', () => {
    const { rerender } = render(
      <SelectorDeAmbientes
        id="ambienteId"
        nombre="ambienteId"
        etiqueta="Ambiente"
        ambientes={AMBIENTES_EJEMPLO}
        valor=""
        onChange={vi.fn()}
      />,
    )

    const lab = screen.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    const auditorio = screen.getByRole('radio', { name: /Auditorio Principal/ })
    const sala = screen.getByRole('radio', { name: /Sala de Reuniones A/ })

    expect(lab).toHaveAttribute('tabindex', '0')
    expect(auditorio).toHaveAttribute('tabindex', '-1')
    expect(sala).toHaveAttribute('tabindex', '-1')

    rerender(
      <SelectorDeAmbientes
        id="ambienteId"
        nombre="ambienteId"
        etiqueta="Ambiente"
        ambientes={AMBIENTES_EJEMPLO}
        valor="2"
        onChange={vi.fn()}
      />,
    )

    expect(lab).toHaveAttribute('tabindex', '-1')
    expect(auditorio).toHaveAttribute('tabindex', '0')
    expect(auditorio).toHaveAttribute('aria-checked', 'true')
    expect(sala).toHaveAttribute('tabindex', '-1')
  })

  it('navegación por teclado con flechas navega y selecciona entre tarjetas disponibles (omite mantenimiento)', async () => {
    const alCambiar = vi.fn()
    render(
      <SelectorDeAmbientes
        id="ambienteId"
        nombre="ambienteId"
        etiqueta="Ambiente"
        ambientes={AMBIENTES_EJEMPLO}
        valor="1"
        onChange={alCambiar}
      />,
    )

    const lab = screen.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    lab.focus()
    expect(lab).toHaveFocus()

    // ArrowDown va al siguiente habilitado: Auditorio (id 2)
    await userEvent.keyboard('{ArrowDown}')
    expect(alCambiar).toHaveBeenCalledWith({
      target: { name: 'ambienteId', value: '2' },
    })

    // ArrowDown vuelve cíclicamente al primero habilitado (omite Sala que está en mantenimiento)
    const auditorio = screen.getByRole('radio', { name: /Auditorio Principal/ })
    auditorio.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(alCambiar).toHaveBeenLastCalledWith({
      target: { name: 'ambienteId', value: '1' },
    })
  })

  it('teclas Home y End van al primer y último ambiente disponible', async () => {
    const alCambiar = vi.fn()
    render(
      <SelectorDeAmbientes
        id="ambienteId"
        nombre="ambienteId"
        etiqueta="Ambiente"
        ambientes={AMBIENTES_EJEMPLO}
        valor="1"
        onChange={alCambiar}
      />,
    )

    const lab = screen.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    lab.focus()

    await userEvent.keyboard('{End}')
    // El último disponible es Auditorio Principal (id 2)
    expect(alCambiar).toHaveBeenCalledWith({
      target: { name: 'ambienteId', value: '2' },
    })

    await userEvent.keyboard('{Home}')
    // El primero disponible es Laboratorio de Cómputo 2 (id 1)
    expect(alCambiar).toHaveBeenLastCalledWith({
      target: { name: 'ambienteId', value: '1' },
    })
  })

  it('teclas Espacio y Enter seleccionan la tarjeta enfocada', async () => {
    const alCambiar = vi.fn()
    render(
      <SelectorDeAmbientes
        id="ambienteId"
        nombre="ambienteId"
        etiqueta="Ambiente"
        ambientes={AMBIENTES_EJEMPLO}
        valor=""
        onChange={alCambiar}
      />,
    )

    const lab = screen.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    lab.focus()

    await userEvent.keyboard('{Enter}')
    expect(alCambiar).toHaveBeenCalledWith({
      target: { name: 'ambienteId', value: '1' },
    })

    await userEvent.keyboard(' ')
    expect(alCambiar).toHaveBeenCalledTimes(2)
  })

  it('muestra el mensaje de error y marca aria-invalid en el radiogroup', () => {
    render(
      <SelectorDeAmbientes
        id="ambienteId"
        nombre="ambienteId"
        etiqueta="Ambiente"
        ambientes={AMBIENTES_EJEMPLO}
        valor=""
        error="Elige un ambiente."
        onChange={vi.fn()}
      />,
    )

    const grupo = screen.getByRole('radiogroup', { name: 'Ambiente' })
    expect(grupo).toHaveAttribute('aria-invalid', 'true')
    expect(grupo).toHaveAccessibleDescription('Elige un ambiente.')
    expect(screen.getByText('Elige un ambiente.')).toBeInTheDocument()
  })

  it('muestra la ayuda si no hay error y se asocia por aria-describedby', () => {
    render(
      <SelectorDeAmbientes
        id="ambienteId"
        nombre="ambienteId"
        etiqueta="Ambiente"
        ambientes={AMBIENTES_EJEMPLO}
        valor=""
        ayuda="30 personas · Pabellón A, piso 2"
        onChange={vi.fn()}
      />,
    )

    const grupo = screen.getByRole('radiogroup', { name: 'Ambiente' })
    expect(grupo).toHaveAccessibleDescription('30 personas · Pabellón A, piso 2')
  })

  it('con el selector vacío y error, el foco va a la primera tarjeta habilitada mediante inputRef', () => {
    let elementoRef = null
    render(
      <SelectorDeAmbientes
        id="ambienteId"
        nombre="ambienteId"
        etiqueta="Ambiente"
        ambientes={AMBIENTES_EJEMPLO}
        valor=""
        error="Elige un ambiente."
        onChange={vi.fn()}
        inputRef={(el) => {
          elementoRef = el
        }}
      />,
    )

    const grupo = screen.getByRole('radiogroup', { name: 'Ambiente' })
    expect(grupo).toHaveAttribute('aria-invalid', 'true')
    expect(grupo).toHaveAccessibleDescription('Elige un ambiente.')

    // El inputRef asignado debe ser la primera tarjeta disponible
    expect(elementoRef).toBeInTheDocument()
    expect(elementoRef).toHaveAttribute('role', 'radio')
    expect(elementoRef).toHaveAttribute('aria-label', 'Laboratorio de Cómputo 2')

    // Al enfocar mediante inputRef, la tarjeta enfocada recibe el foco activo
    elementoRef.focus()
    expect(elementoRef).toHaveFocus()
  })

  it('patrón WAI-ARIA: Tab sale del radiogroup porque solo una tarjeta tiene tabIndex=0', async () => {
    render(
      <div>
        <SelectorDeAmbientes
          id="ambienteId"
          nombre="ambienteId"
          etiqueta="Ambiente"
          ambientes={AMBIENTES_EJEMPLO}
          valor="1"
          onChange={vi.fn()}
        />
        <button type="button">Siguiente campo</button>
      </div>,
    )

    const lab = screen.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    const siguienteBoton = screen.getByRole('button', { name: 'Siguiente campo' })

    lab.focus()
    expect(lab).toHaveFocus()

    // Al presionar Tab, sale directamente del grupo al siguiente elemento enfocable
    await userEvent.tab()
    expect(siguienteBoton).toHaveFocus()
  })
})
