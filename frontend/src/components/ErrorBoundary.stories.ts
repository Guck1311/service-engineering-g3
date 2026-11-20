import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, h } from 'vue'
import { ApiError } from '@/api/api-error'
import { withToasts } from '@/stories/decorators'
import ErrorBoundary from './ErrorBoundary.vue'

/**
 * Wraps the page content in App.vue. A component below it that throws while
 * rendering (a bug) is replaced by a fallback with "Try again", instead of
 * leaving a blank page. API errors are NOT caught here: they continue to the
 * global error handler, which shows a toast.
 */

/** A page that crashes the first `failures` times it is created. */
function crashingPage(failures: number, error: () => Error) {
  let attempts = 0
  return defineComponent({
    name: 'CrashingPage',
    setup() {
      attempts++
      if (attempts <= failures) throw error()
      return () =>
        h('div', { class: 'alert alert-success mb-0' }, [
          h('i', { class: 'bi bi-check-circle me-2' }),
          `Rendered successfully (attempt ${attempts}).`,
        ])
    },
  })
}

const bug = () => new TypeError("Cannot read properties of undefined (reading 'title')")

const meta = {
  title: 'Errors/ErrorBoundary',
  component: ErrorBoundary,
  decorators: [withToasts],
} satisfies Meta<typeof ErrorBoundary>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing goes wrong: the slot content is shown unchanged. */
export const ContentRenders: Story = {
  render: () => ({
    components: { ErrorBoundary, Page: crashingPage(0, bug) },
    template: '<ErrorBoundary><Page /></ErrorBoundary>',
  }),
}

/** The page throws once. "Try again" re-creates it, and the second attempt works. */
export const CrashThenTryAgain: Story = {
  render: () => ({
    components: { ErrorBoundary, Page: crashingPage(1, bug) },
    template: '<ErrorBoundary><Page /></ErrorBoundary>',
  }),
}

/** The page keeps crashing: the fallback stays, with a link back to the catalogue. */
export const CrashesEveryTime: Story = {
  render: () => ({
    components: { ErrorBoundary, Page: crashingPage(Infinity, bug) },
    template: '<ErrorBoundary><Page /></ErrorBoundary>',
  }),
}

/**
 * An ApiError is an expected failure, not a bug: the boundary lets it pass
 * (returns true), and app.config.errorHandler shows it as a toast.
 */
export const ApiErrorPassesThrough: Story = {
  render: () => ({
    components: {
      ErrorBoundary,
      Page: crashingPage(Infinity, () => new ApiError('Requires role ADMIN', 'http', 403)),
    },
    template: '<ErrorBoundary><Page /></ErrorBoundary>',
  }),
}
