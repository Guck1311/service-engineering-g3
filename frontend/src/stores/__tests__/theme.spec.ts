import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { THEME_STORAGE_KEY, useThemeStore } from '../theme'

/** Fake OS setting: jsdom has no matchMedia, so the test provides one it can control. */
function mockSystemTheme(dark: boolean) {
  const listeners: ((event: { matches: boolean }) => void)[] = []
  const media = {
    matches: dark,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) =>
      listeners.push(listener),
  }
  vi.stubGlobal('matchMedia', () => media)
  return {
    /** Simulates the user switching the operating system theme. */
    change(toDark: boolean) {
      media.matches = toDark
      listeners.forEach((listener) => listener({ matches: toDark }))
    },
  }
}

const htmlTheme = () => document.documentElement.getAttribute('data-bs-theme')

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('theme store', () => {
  it('follows the operating system by default', async () => {
    const system = mockSystemTheme(true)
    const theme = useThemeStore()

    expect(theme.preference).toBe('auto')
    expect(theme.theme).toBe('dark')
    expect(htmlTheme()).toBe('dark')

    system.change(false)
    await nextTick()
    expect(theme.theme).toBe('light')
    expect(htmlTheme()).toBe('light')
  })

  it('an explicit choice overrides the system setting', async () => {
    const system = mockSystemTheme(true)
    const theme = useThemeStore()

    theme.setPreference('light')
    await nextTick()
    expect(htmlTheme()).toBe('light')

    system.change(true)
    await nextTick()
    expect(theme.theme).toBe('light')
  })

  it('cycles light -> dark -> auto -> light', () => {
    mockSystemTheme(false)
    const theme = useThemeStore()
    theme.setPreference('light')

    const seen = [1, 2, 3].map(() => {
      theme.cycle()
      return theme.preference
    })
    expect(seen).toEqual(['dark', 'auto', 'light'])
  })

  it('remembers the choice across reloads', async () => {
    mockSystemTheme(false)
    useThemeStore().setPreference('dark')
    await nextTick()
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    setActivePinia(createPinia()) // simulated reload
    expect(useThemeStore().theme).toBe('dark')
  })

  it('works without matchMedia (falls back to light)', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(useThemeStore().theme).toBe('light')
  })
})
