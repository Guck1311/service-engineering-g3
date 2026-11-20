import { computed, ref, watch, watchEffect } from 'vue'
import { defineStore } from 'pinia'

/** What the user chose. `auto` follows the operating system setting. */
export type ThemePreference = 'light' | 'dark' | 'auto'
/** What is actually shown. */
export type Theme = 'light' | 'dark'

/** Also read by the inline script in index.html (keep the key in sync). */
export const THEME_STORAGE_KEY = 'music-collection.theme'

const NEXT: Record<ThemePreference, ThemePreference> = {
  light: 'dark',
  dark: 'auto',
  auto: 'light',
}

function readStoredPreference(): ThemePreference | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' || value === 'auto' ? value : null
  } catch {
    return null
  }
}

function storePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // ignore: the choice is just not remembered
  }
}

/**
 * Light/dark color mode. Bootstrap 5.3 switches all its colors via CSS variables
 * when <html> has data-bs-theme="dark", so the store only has to set that attribute.
 */
export const useThemeStore = defineStore('theme', () => {
  const preference = ref<ThemePreference>(readStoredPreference() ?? 'auto')

  // The OS setting, as reactive state: `matchMedia` reports changes as events,
  // e.g. when Windows switches to dark mode in the evening.
  const media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null
  const systemPrefersDark = ref(media?.matches ?? false)
  media?.addEventListener('change', (event) => {
    systemPrefersDark.value = event.matches
  })

  const theme = computed<Theme>(() =>
    preference.value === 'auto' ? (systemPrefersDark.value ? 'dark' : 'light') : preference.value,
  )

  // watchEffect: runs once now and again whenever `theme` changes.
  // A side effect outside Vue's own DOM (the <html> element is not part of the app).
  watchEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme.value)
  })

  watch(preference, storePreference)

  function setPreference(value: ThemePreference) {
    preference.value = value
  }

  /** light → dark → auto → light */
  function cycle() {
    preference.value = NEXT[preference.value]
  }

  return { preference, theme, setPreference, cycle }
})
