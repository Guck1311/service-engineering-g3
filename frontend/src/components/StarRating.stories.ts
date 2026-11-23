import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import StarRating from './StarRating.vue'

/**
 * Supports `v-model` via defineModel(). The stories write the new value back
 * into the args, so clicking a star updates the control panel as well.
 */
const meta = {
  title: 'Basics/StarRating',
  component: StarRating,
  args: {
    modelValue: 3,
    readonly: false,
    label: 'Rating',
    'onUpdate:modelValue': fn(),
  },
  argTypes: {
    modelValue: { control: { type: 'number', min: 0, max: 5, step: 0.5 } },
  },
  render: (args) => {
    const [, updateArgs] = useArgs()
    return {
      components: { StarRating },
      setup: () => ({ args, update: (value: number | null) => updateArgs({ modelValue: value }) }),
      template: '<StarRating v-bind="args" @update:model-value="update" />',
    }
  },
} satisfies Meta<typeof StarRating>

export default meta
type Story = StoryObj<typeof meta>

/** Hover previews, click selects. */
export const Editable: Story = {}

export const NotRatedYet: Story = { args: { modelValue: null } }

/** Display only, e.g. the average. Fractions are shown as half stars. */
export const ReadonlyAverage: Story = {
  args: { modelValue: 4.5, readonly: true, label: 'Average rating' },
}
