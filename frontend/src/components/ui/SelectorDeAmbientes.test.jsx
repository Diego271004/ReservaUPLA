import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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

const montar = (props = {}) =>
  render(
    <SelectorDeAmbientes
      id="ambienteId"
      nombre="ambienteId"
      etiqueta="Ambiente"
      ambientes={AMBIENTES_EJEMPLO}
      valor=""
      onChange={vi.fn()}
      {...props}
    />,
  )

describe('SelectorDeAmbientes (tarjetas seleccionables accesibles)', () => {
  it('renderiza el radiogroup con su etiqueta y cada ambiente como tarjeta radio', () => {
    montar()
    const grupo = screen.getByRole('radiogroup', { name: 'Ambiente' })
    expect(grupo).toBeInTheDocument()
    const radios = within(grupo).getAllByRole('radio')
    expect(radios).toHaveLength(3)

    expect(radios[0]).toHaveAttribute('aria-label', 'Laboratorio de Cómputo 2')
    expect(within(radios[0]).getByText('Laboratorio de Cómputo 2')).toBeInTheDocument()
    expect(within(radios[0]).getByText('30 personas · Pabellón A, piso 2')).toBeInTheDocument()
    expect(within(radios[0]).getByText('Disponible')).toBeInTheDocument()

    expect(radios[2]).toHaveAttribute(
      'aria-label',
      'Sala de Reuniones A · En mantenimiento (no disponible)',
    )
    expect(radios[2]).toHaveAttribute('aria-disabled', 'true')
    expect(within(radios[2]).getByText('En mantenimiento (no disponible)')).toBeInTheDocument()
  })

  it('un clic en un ambiente disponible llama a onChange con su id', async () => {
    const alCambiar = vi.fn()
    montar({ onChange: alCambiar })
    await userEvent.click(screen.getByRole('radio', { name: /Auditorio Principal/ }))
    expect(alCambiar).toHaveBeenCalledWith({ target: { name: 'ambienteId', value: '2' } })
  })

  it('un clic en un ambiente en mantenimiento no llama a onChange', async () => {
    const alCambiar = vi.fn()
    montar({ onChange: alCambiar })
    await userEvent.click(screen.getByRole('radio', { name: /Sala de Reuniones A/ }))
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('roving tabindex: sin selección el primer habilitado tiene tabIndex=0; con selección solo el elegido tiene 0', () => {
    const { rerender } = montar()
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
    montar({ valor: '1', onChange: alCambiar })
    const lab = screen.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    lab.focus()
    expect(lab).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    expect(alCambiar).toHaveBeenCalledWith({ target: { name: 'ambienteId', value: '2' } })

    const auditorio = screen.getByRole('radio', { name: /Auditorio Principal/ })
    auditorio.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(alCambiar).toHaveBeenLastCalledWith({ target: { name: 'ambienteId', value: '1' } })
  })

  it('teclas Home y End van al primer y último ambiente disponible', async () => {
    const alCambiar = vi.fn()
    montar({ valor: '1', onChange: alCambiar })
    const lab = screen.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    lab.focus()

    await userEvent.keyboard('{End}')
    expect(alCambiar).toHaveBeenCalledWith({ target: { name: 'ambienteId', value: '2' } })

    await userEvent.keyboard('{Home}')
    expect(alCambiar).toHaveBeenLastCalledWith({ target: { name: 'ambienteId', value: '1' } })
  })

  it('flechas Izquierda y Arriba navegan en orden inverso entre ambientes disponibles', async () => {
    const alCambiar = vi.fn()
    montar({ valor: '2', onChange: alCambiar })
    const auditorio = screen.getByRole('radio', { name: /Auditorio Principal/ })
    auditorio.focus()

    await userEvent.keyboard('{ArrowLeft}')
    expect(alCambiar).toHaveBeenCalledWith({ target: { name: 'ambienteId', value: '1' } })

    const lab = screen.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    lab.focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(alCambiar).toHaveBeenLastCalledWith({ target: { name: 'ambienteId', value: '2' } })
  })

  it('espacio o enter en una tarjeta deshabilitada no la selecciona', async () => {
    const alCambiar = vi.fn()
    montar({ onChange: alCambiar })
    const sala = screen.getByRole('radio', { name: /Sala de Reuniones A/ })
    sala.focus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Enter}')
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('muestra mensaje de error accesible asociado mediante aria-describedby y aria-invalid', () => {
    montar({ error: 'Debes seleccionar un ambiente.' })
    const grupo = screen.getByRole('radiogroup', { name: 'Ambiente' })
    expect(grupo).toHaveAttribute('aria-invalid', 'true')
    expect(grupo).toHaveAccessibleDescription('Debes seleccionar un ambiente.')
    expect(screen.getByText('Debes seleccionar un ambiente.')).toBeInTheDocument()
  })

  it('muestra texto de ayuda accesible asociado mediante aria-describedby', () => {
    montar({ ayuda: '30 personas · Pabellón A, piso 2' })
    const grupo = screen.getByRole('radiogroup', { name: 'Ambiente' })
    expect(grupo).toHaveAccessibleDescription('30 personas · Pabellón A, piso 2')
  })

  it('con el selector vacío y error, el foco va a la primera tarjeta habilitada mediante inputRef', () => {
    let elementoRef = null
    montar({
      error: 'Elige un ambiente.',
      inputRef: (el) => {
        elementoRef = el
      },
    })
    const grupo = screen.getByRole('radiogroup', { name: 'Ambiente' })
    expect(grupo).toHaveAttribute('aria-invalid', 'true')
    expect(grupo).toHaveAccessibleDescription('Elige un ambiente.')
    expect(elementoRef).toBeInTheDocument()
    expect(elementoRef).toHaveAttribute('role', 'radio')
    expect(elementoRef).toHaveAttribute('aria-label', 'Laboratorio de Cómputo 2')
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
    await userEvent.tab()
    expect(siguienteBoton).toHaveFocus()
  })

  it('la tarjeta elegida incluye la marca de verificación en el indicador superior derecho', () => {
    montar({ valor: '1' })
    const lab = screen.getByRole('radio', { name: /Laboratorio de Cómputo 2/ })
    expect(lab).toHaveAttribute('aria-checked', 'true')
    expect(lab.className).toMatch(/seleccionada/)
    const indicador = lab.querySelector('[class*="indicadorRadioSeleccionado"]')
    expect(indicador).toBeInTheDocument()
    expect(indicador.querySelector('svg')).toBeInTheDocument()
  })

  it('la animación de la marca de verificación existe y se desactiva con movimiento reducido', () => {
    const css = readFileSync(join(__dirname, 'SelectorDeAmbientes.module.css'), 'utf8')
    expect(css).toContain('animacionMarca')
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  })
})
