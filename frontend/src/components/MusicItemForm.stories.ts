import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { abbeyRoad } from '@/stories/fixtures'
import MusicItemForm from './MusicItemForm.vue'

/**
 * The admin's create/edit form. It validates on the client and emits `submit`
 * with the request body; saving is the page's job (see the Actions panel).
 */
const meta = {
  title: 'Music/MusicItemForm',
  component: MusicItemForm,
  args: { submitting: false, onSubmit: fn(), onCancel: fn() },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="max-width: 48rem"><story /></div>',
    }),
  ],
} satisfies Meta<typeof MusicItemForm>

export default meta
type Story = StoryObj<typeof meta>

/** Empty form for a new item. Switch the type: "Number of tracks" only exists for albums and playlists. */
export const Create: Story = {}

/** Pre-filled; the type of an existing item cannot change. */
export const Edit: Story = { args: { initial: abbeyRoad } }

/** While the request runs, the whole fieldset is disabled. */
export const Submitting: Story = { args: { initial: abbeyRoad, submitting: true } }

/**
 * Submitting an empty form shows the validation messages and emits nothing.
 * This story clicks the button itself (a "play function") and checks the result.
 */
export const ValidationErrors: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /create item/i }))
    await expect(canvas.getByLabelText(/title/i)).toHaveClass('is-invalid')
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}
