import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { useThemeStore } from '@/stores/theme'
import { onNavbar } from '@/stories/decorators'
import ThemeToggle from './ThemeToggle.vue'

/**
 * Cycles light → dark → auto. The theme store sets data-bs-theme on <html>,
 * so clicking it switches this whole Storybook canvas, just like the app.
 */
const meta = {
  title: 'App shell/ThemeToggle',
  component: ThemeToggle,
  decorators: [onNavbar],
} satisfies Meta<typeof ThemeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {
  beforeEach() {
    useThemeStore().setPreference('light')
  },
}

export const Dark: Story = {
  beforeEach() {
    useThemeStore().setPreference('dark')
  },
}

/** Follows the operating system setting. */
export const Auto: Story = {
  beforeEach() {
    useThemeStore().setPreference('auto')
  },
}
