import { afterEach, describe, expect, it, vi } from 'vitest'
import { consultarSalud } from './saludService'

describe('consultarSalud', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('devuelve true cuando la API responde 200', async () => {
    const fetchSimulado = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchSimulado)

    expect(await consultarSalud()).toBe(true)
    expect(fetchSimulado).toHaveBeenCalledWith('/api/salud')
  })

  it('devuelve false cuando la API responde 503', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    expect(await consultarSalud()).toBe(false)
  })

  it('devuelve false cuando la red falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')))

    expect(await consultarSalud()).toBe(false)
  })
})
