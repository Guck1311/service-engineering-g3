import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { useNotificationsStore, type Notification } from '@/stores/notifications'
import ToastHost from './ToastHost.vue'

/**
 * Shows the notifications store as Bootstrap toasts in the bottom-right corner.
 * In the app they disappear after 3-8 s; these stories put them into the store
 * directly, so they stay. For toasts caused by real errors, see "Error handling / Error sources".
 */
const meta = {
  title: 'Errors/ToastHost',
  component: ToastHost,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="min-height: 28rem"><story /></div>',
    }),
  ],
} satisfies Meta<typeof ToastHost>

export default meta
type Story = StoryObj<typeof meta>

function show(...notifications: Omit<Notification, 'id'>[]) {
  useNotificationsStore().notifications = notifications.map((n, i) => ({ id: i + 1, ...n }))
}

/** The four kinds: success, info, warning and error. */
export const AllKinds: Story = {
  beforeEach() {
    show(
      { kind: 'success', message: 'Added "Abbey Road" to your collection.', details: [] },
      { kind: 'info', message: 'Your collection was reloaded.', details: [] },
      {
        kind: 'warning',
        message:
          'This page could not be loaded, probably because a new version was deployed. Please reload the page.',
        details: [],
      },
      {
        kind: 'error',
        message: 'The server cannot be reached. Is the backend running?',
        details: [],
      },
    )
  },
}

/** A 400 response: the individual validation messages are listed. */
export const ValidationError: Story = {
  beforeEach() {
    show({
      kind: 'error',
      message: 'Please check your input.',
      details: [
        'text should not be empty',
        'text must be shorter than or equal to 2000 characters',
      ],
    })
  },
}

/** A bug in the frontend: the user sees a neutral message, the details go to the console. */
export const UnexpectedError: Story = {
  beforeEach() {
    show({ kind: 'error', message: 'Something went wrong. Please try again.', details: [] })
  },
}
