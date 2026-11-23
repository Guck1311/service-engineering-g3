import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ApiError } from '@/api/api-error'
import { useSessionStore } from '@/stores/session'
import { get, mockApi, networkError } from '@/stories/mock-api'
import ConnectionBanner from './ConnectionBanner.vue'

/**
 * A banner under the navbar for the two situations in which nothing works:
 * the browser is offline, or the user list could not be loaded at startup.
 */
const meta = {
  title: 'Errors/ConnectionBanner',
  component: ConnectionBanner,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ConnectionBanner>

export default meta
type Story = StoryObj<typeof meta>

/** Online and the backend answered: nothing is shown. */
export const Online: Story = {}

/**
 * The browser reports no connection (in the app: the `offline` event).
 * The story pretends navigator.onLine is false and restores it afterwards.
 */
export const Offline: Story = {
  beforeEach() {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
    return () => {
      // Remove the override: the real value from Navigator.prototype applies again.
      delete (navigator as { onLine?: boolean }).onLine
    }
  },
}

/**
 * GET /users failed at startup, e.g. because the free Render instance is asleep.
 * "Retry" loads the users again; the fake backend answers this time, so the banner disappears.
 */
export const BackendDownRetrySucceeds: Story = {
  beforeEach() {
    useSessionStore().error = new ApiError(
      'The server cannot be reached. Is the backend running?',
      'network',
    )
  },
}

/** Same, but the backend stays unreachable: Retry shows a spinner, then the banner again. */
export const BackendStaysDown: Story = {
  beforeEach() {
    useSessionStore().error = new ApiError(
      'The server cannot be reached. Is the backend running?',
      'network',
    )
    mockApi(get('/users', networkError))
  },
}
