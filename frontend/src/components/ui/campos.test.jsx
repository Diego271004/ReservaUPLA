import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import DateInput from './DateInput.jsx'
import PasswordInput from './PasswordInput.jsx'
import SelectInput from './SelectInput.jsx'
import TextInput from './TextInput.jsx'
import TimeInput from './TimeInput.jsx'

describe('TextInput', () => {
  const base = { id: 'correo', nombre: 'correo', etiqueta: 'Correo institucional', valor: '' }

  it('normal: etiqueta visible asociada al campo, ayuda debajo y sin texto de ejemplo dentro', () => {
    render(<TextInput {...base} ayuda="Ejemplo: nombre.apellido@upla.edu.pe" onChange={() => {}} />)
    const campo = screen.getByLabelText('Correo institucional')
    expect(campo).toHaveValue('')
    expect(campo).not.toHaveAttribute('placeholder')
    expect(campo).toHaveAccessibleDescription('Ejemplo: nombre.apellido@upla.edu.pe')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('escribir: avisa del cambio con el nombre del campo', async () => {
    const alCambiar = vi.fn()
    render(<TextInput {...base} onChange={alCambiar} />)
    await userEvent.type(screen.getByLabelText('Correo institucional'), 'a')
    expect(alCambiar).toHaveBeenCalledTimes(1)
    expect(alCambiar.mock.calls[0][0].target.name).toBe('correo')
  })

  it('foco: el campo recibe el foco con el teclado', async () => {
    render(<TextInput {...base} onChange={() => {}} />)
    await userEvent.tab()
    expect(screen.getByLabelText('Correo institucional')).toHaveFocus()
  })

  it('al salir del campo avisa con onBlur', async () => {
    const alSalir = vi.fn()
    render(<TextInput {...base} onChange={() => {}} onBlur={alSalir} />)
    await userEvent.tab()
    await userEvent.tab()
    expect(alSalir).toHaveBeenCalledTimes(1)
  })

  it('error: muestra el mensaje con el icono único, marca el campo inválido y lo asocia', () => {
    const { container } = render(
      <TextInput
        {...base}
        error="Ingresa tu correo institucional."
        ayuda="Ejemplo"
        onChange={() => {}}
      />,
    )
    const campo = screen.getByLabelText('Correo institucional')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Ingresa tu correo institucional.')).toBeInTheDocument()
    expect(campo).toHaveAccessibleDescription('Ingresa tu correo institucional. Ejemplo')
    expect(container.querySelector('[data-icono="error"]')).toBeInTheDocument()
  })

  it('deshabilitado: no se puede escribir ni enfocar', async () => {
    render(<TextInput {...base} deshabilitado onChange={() => {}} />)
    const campo = screen.getByLabelText('Correo institucional')
    expect(campo).toBeDisabled()
    await userEvent.tab()
    expect(campo).not.toHaveFocus()
  })

  it('solo lectura (durante el envío): conserva el valor y no deja editar', async () => {
    const alCambiar = vi.fn()
    render(<TextInput {...base} valor="ana@upla.edu.pe" soloLectura onChange={alCambiar} />)
    const campo = screen.getByLabelText('Correo institucional')
    expect(campo).toHaveAttribute('readonly')
    await userEvent.type(campo, 'x')
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('multilínea: se muestra como área de texto', () => {
    render(<TextInput {...base} id="motivo" etiqueta="Motivo" multilinea onChange={() => {}} />)
    expect(screen.getByLabelText('Motivo').tagName).toBe('TEXTAREA')
  })

  it('aviso: se anuncia como estado, con su texto', () => {
    render(<TextInput {...base} aviso="Bloq Mayús está activado." onChange={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent('Bloq Mayús está activado.')
  })
})

describe('PasswordInput', () => {
  const props = { id: 'contrasena', nombre: 'contrasena', etiqueta: 'Contraseña', valor: 'secreta' }

  it('oculta la contraseña y el botón dice Mostrar', () => {
    render(<PasswordInput {...props} mostrando={false} onAlternar={() => {}} onChange={() => {}} />)
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toHaveTextContent('Mostrar')
  })

  it('al mostrar: es de texto y el botón dice Ocultar', () => {
    render(<PasswordInput {...props} mostrando onAlternar={() => {}} onChange={() => {}} />)
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveTextContent('Ocultar')
    expect(
      screen.getByRole('button', { name: 'Ocultar contraseña' }),
    ).not.toHaveAttribute('aria-pressed')
  })

  it('el botón alterna con clic y con el teclado (Enter)', async () => {
    const alternar = vi.fn()
    render(<PasswordInput {...props} mostrando={false} onAlternar={alternar} onChange={() => {}} />)
    const boton = screen.getByRole('button', { name: 'Mostrar contraseña' })
    await userEvent.click(boton)
    boton.focus()
    await userEvent.keyboard('{Enter}')
    expect(alternar).toHaveBeenCalledTimes(2)
  })

  it('deshabilitado: el botón Mostrar también se deshabilita', () => {
    render(
      <PasswordInput
        {...props}
        deshabilitado
        mostrando={false}
        onAlternar={() => {}}
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeDisabled()
  })

  it('error: muestra el mensaje debajo', () => {
    render(
      <PasswordInput
        {...props}
        error="Ingresa tu contraseña."
        mostrando={false}
        onAlternar={() => {}}
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument()
  })
})

describe('SelectInput', () => {
  const opciones = [
    { valor: '1', etiqueta: 'Laboratorio' },
    { valor: '2', etiqueta: 'Auditorio' },
    { valor: '3', etiqueta: 'Sala (no disponible)', deshabilitada: true },
  ]
  const base = { id: 'tipo', nombre: 'tipo', etiqueta: 'Tipo', valor: '', opciones }

  it('con otro texto vacío (por ejemplo «Todos») lo usa en la primera opción', () => {
    render(<SelectInput {...base} textoVacio="Todos" onChange={() => {}} />)
    expect(screen.getByLabelText('Tipo')).toHaveDisplayValue('Todos')
  })

  it('con textoVacio nulo no hay opción vacía: siempre hay una elegida', () => {
    render(<SelectInput {...base} valor="2" textoVacio={null} onChange={() => {}} />)
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Laboratorio',
      'Auditorio',
      'Sala (no disponible)',
    ])
    expect(screen.getByLabelText('Tipo')).toHaveDisplayValue('Auditorio')
  })

  it('vacío: muestra "Selecciona…" y las opciones de la lista', () => {
    render(<SelectInput {...base} onChange={() => {}} />)
    const lista = screen.getByLabelText('Tipo')
    expect(lista).toHaveDisplayValue('Selecciona…')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Selecciona…',
      'Laboratorio',
      'Auditorio',
      'Sala (no disponible)',
    ])
  })

  it('elegir una opción avisa con nombre y valor', async () => {
    const recibidos = []
    render(
      <SelectInput
        {...base}
        onChange={(e) => recibidos.push({ name: e.target.name, value: e.target.value })}
      />,
    )
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'Auditorio')
    expect(recibidos).toEqual([{ name: 'tipo', value: '2' }])
  })

  it('prevención de errores: una opción deshabilitada no se puede elegir', async () => {
    const alCambiar = vi.fn()
    render(<SelectInput {...base} onChange={alCambiar} />)
    expect(screen.getByRole('option', { name: 'Sala (no disponible)' })).toBeDisabled()
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), '3')
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('con el teclado: se llega con Tab y la lista abierta con el teclado deja elegir una opción', async () => {
    function Controlado() {
      const [valor, setValor] = useState('')
      return <SelectInput {...base} valor={valor} onChange={(e) => setValor(e.target.value)} />
    }
    render(<Controlado />)
    await userEvent.tab()
    expect(screen.getByLabelText('Tipo')).toHaveFocus()
    // Las flechas cambian la opción en el navegador (comportamiento nativo del <select>); aquí se elige con la API de pruebas.
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'Laboratorio')
    expect(screen.getByLabelText('Tipo')).toHaveValue('1')
  })

  it('error: marca el campo inválido y muestra el mensaje', () => {
    render(<SelectInput {...base} error="Selecciona un ambiente." onChange={() => {}} />)
    expect(screen.getByLabelText('Tipo')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Selecciona un ambiente.')).toBeInTheDocument()
  })

  it('deshabilitado: no se puede enfocar', async () => {
    render(<SelectInput {...base} deshabilitado onChange={() => {}} />)
    await userEvent.tab()
    expect(screen.getByLabelText('Tipo')).toBeDisabled()
    expect(screen.getByLabelText('Tipo')).not.toHaveFocus()
  })
})

describe('DateInput', () => {
  const base = { id: 'fecha', nombre: 'fecha', etiqueta: 'Fecha', valor: '' }

  function Controlado({ inicial = '', ...resto }) {
    const [valor, setValor] = useState(inicial)
    return (
      <DateInput {...base} {...resto} valor={valor} onChange={(e) => setValor(e.target.value)} />
    )
  }

  it('escribir solo dígitos da el formato dd/mm/aaaa', async () => {
    render(<Controlado />)
    await userEvent.type(screen.getByLabelText('Fecha'), '05112026')
    expect(screen.getByLabelText('Fecha')).toHaveValue('05/11/2026')
  })

  it('no admite letras ni más de 8 dígitos', async () => {
    render(<Controlado />)
    await userEvent.type(screen.getByLabelText('Fecha'), 'ab05/11/2026999')
    expect(screen.getByLabelText('Fecha')).toHaveValue('05/11/2026')
  })

  it('muestra el valor por defecto y el icono de calendario', () => {
    const { container } = render(<Controlado inicial="03/11/2026" />)
    expect(screen.getByLabelText('Fecha')).toHaveValue('03/11/2026')
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha')).toHaveAttribute('inputmode', 'numeric')
  })

  it('error y deshabilitado', () => {
    const { rerender } = render(
      <DateInput {...base} error="Ingresa la fecha de la reserva." onChange={() => {}} />,
    )
    expect(screen.getByText('Ingresa la fecha de la reserva.')).toBeInTheDocument()
    rerender(<DateInput {...base} deshabilitado onChange={() => {}} />)
    expect(screen.getByLabelText('Fecha')).toBeDisabled()
  })

  it('foco con el teclado', async () => {
    render(<Controlado />)
    await userEvent.tab()
    expect(screen.getByLabelText('Fecha')).toHaveFocus()
  })
})

describe('TimeInput (hallazgo N1: lista cerrada)', () => {
  const horas = ['07:00', '07:30', '08:00']
  const base = {
    id: 'horaInicio',
    nombre: 'horaInicio',
    etiqueta: 'Hora de inicio',
    valor: '',
    horas,
  }

  it('solo ofrece las horas de la lista (más "Selecciona…")', () => {
    render(<TimeInput {...base} onChange={() => {}} />)
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Selecciona…',
      '07:00',
      '07:30',
      '08:00',
    ])
  })

  it('no se puede escribir una hora libre: es una lista, no un campo de texto', () => {
    render(<TimeInput {...base} onChange={() => {}} />)
    expect(screen.getByLabelText('Hora de inicio').tagName).toBe('SELECT')
  })

  it('elegir una hora avisa con su valor', async () => {
    const recibidos = []
    render(
      <TimeInput
        {...base}
        onChange={(e) => recibidos.push({ name: e.target.name, value: e.target.value })}
      />,
    )
    await userEvent.selectOptions(screen.getByLabelText('Hora de inicio'), '07:30')
    expect(recibidos).toEqual([{ name: 'horaInicio', value: '07:30' }])
  })

  it('error, foco y deshabilitado', async () => {
    const { rerender } = render(
      <TimeInput {...base} error="Selecciona la hora de inicio." onChange={() => {}} />,
    )
    expect(screen.getByText('Selecciona la hora de inicio.')).toBeInTheDocument()
    await userEvent.tab()
    expect(screen.getByLabelText('Hora de inicio')).toHaveFocus()
    rerender(<TimeInput {...base} deshabilitado onChange={() => {}} />)
    expect(screen.getByLabelText('Hora de inicio')).toBeDisabled()
  })
})
