import type { Meta, StoryObj } from '@storybook/vue3-vite'
import LoadingSpinner from './LoadingSpinner.vue'

const meta = {
  title: 'Basics/LoadingSpinner',
  component: LoadingSpinner,
} satisfies Meta<typeof LoadingSpinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithLabel: Story = { args: { label: 'Loading catalogue…' } }
