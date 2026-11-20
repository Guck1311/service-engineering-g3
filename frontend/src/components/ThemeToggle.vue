<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore, type ThemePreference } from '@/stores/theme'

const theme = useThemeStore()

const LABELS: Record<ThemePreference, { label: string; icon: string }> = {
  light: { label: 'Light', icon: 'bi-sun-fill' },
  dark: { label: 'Dark', icon: 'bi-moon-stars-fill' },
  auto: { label: 'Auto', icon: 'bi-circle-half' },
}

const current = computed(() => LABELS[theme.preference])
const title = computed(() =>
  theme.preference === 'auto'
    ? `Theme: auto (system is ${theme.theme}). Click for light.`
    : `Theme: ${theme.preference}. Click for ${theme.preference === 'light' ? 'dark' : 'auto'}.`,
)
</script>

<template>
  <button
    type="button"
    class="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-1"
    :title="title"
    :aria-label="title"
    @click="theme.cycle()"
  >
    <i :class="['bi', current.icon]" aria-hidden="true"></i>
    <span class="d-md-none d-lg-inline">{{ current.label }}</span>
  </button>
</template>
