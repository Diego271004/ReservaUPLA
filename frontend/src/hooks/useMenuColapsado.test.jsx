import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { CLAVE_MENU_COLAPSADO, useMenuColapsado } from './useMenuColapsado.js'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('useMenuColapsado: la preferencia del menú se recuerda en localStorage', () => {
  it('por omisión el menú está expandido', () => {
    const { result } = renderHook(() => useMenuColapsado())
    expect(result.current[0]).toBe(false)
  })

  it('alternar guarda la preferencia y la próxima visita la respeta', () => {
    const { result, unmount } = renderHook(() => useMenuColapsado())
    act(() => result.current[1]())
    expect(result.current[0]).toBe(true)
    expect(localStorage.getItem(CLAVE_MENU_COLAPSADO)).toBe('1')
    unmount()

    const otra = renderHook(() => useMenuColapsado())
    expect(otra.result.current[0]).toBe(true)
    act(() => otra.result.current[1]())
    expect(otra.result.current[0]).toBe(false)
    expect(localStorage.getItem(CLAVE_MENU_COLAPSADO)).toBe('0')
  })

  it('si localStorage no está disponible, funciona igual sin recordar', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    const { result } = renderHook(() => useMenuColapsado())
    expect(result.current[0]).toBe(false)
    act(() => result.current[1]())
    expect(result.current[0]).toBe(true)
  })
})
