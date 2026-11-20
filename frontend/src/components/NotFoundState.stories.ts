import type { Meta, StoryObj } from '@storybook/vue3-vite'
import NotFoundState from './NotFoundState.vue'

/** Shared "not found" display. The explanation text comes from the default slot. */
const meta = {
  title: 'Errors/NotFoundState',
  component: NotFoundState,
} satisfies Meta<typeof NotFoundState>

export default meta
type Story = StoryObj<typeof meta>

/** Unknown URL (the catch-all route). */
export const PageNotFound: Story = {
  render: (args) => ({
    components: { NotFoundState },
    setup: () => ({ args }),
    template: `<NotFoundState v-bind="args">
      The address /does-not-exist does not exist in this app.
    </NotFoundState>`,
  }),
}

/** A music item that does not exist (anymore): the detail page on a 404. */
export const MusicItemNotFound: Story = {
  args: { title: 'Music item not found' },
  render: (args) => ({
    components: { NotFoundState },
    setup: () => ({ args }),
    template: `<NotFoundState v-bind="args">
      There is no music item #99. It may have been deleted.
    </NotFoundState>`,
  }),
}
