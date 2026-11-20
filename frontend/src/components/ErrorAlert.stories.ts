import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import { ApiError } from '@/api/api-error'
import ErrorAlert from './ErrorAlert.vue'

/**
 * Inline error of a page or section whose data could not be loaded.
 * Each story shows the ApiError that the response interceptor creates for one
 * kind of failure; the messages are the ones the backend and api-error.ts produce.
 */
const meta = {
  title: 'Errors/ErrorAlert',
  component: ErrorAlert,
  args: {
    error: new ApiError('Music item 99 not found', 'http', 404),
    retryable: false,
    onRetry: fn(),
  },
  argTypes: { error: { control: false } },
} satisfies Meta<typeof ErrorAlert>

export default meta
type Story = StoryObj<typeof meta>

/** 404: the backend's message is shown as is. (The detail page shows NotFoundState instead.) */
export const NotFound: Story = {}

/** 400 with a list of messages from the backend's ValidationPipe. */
export const ValidationFailed: Story = {
  args: {
    error: new ApiError('Please check your input.', 'http', 400, [
      'title should not be empty',
      'releaseYear must not be greater than 2100',
    ]),
  },
}

/** 403: e.g. changing another user's collection. */
export const Forbidden: Story = {
  args: { error: new ApiError('You can only modify your own data', 'http', 403) },
}

/** 409: the item is already in the collection. */
export const Conflict: Story = {
  args: { error: new ApiError('Music item 6 is already in the collection', 'http', 409) },
}

export const ServerError: Story = {
  args: { error: new ApiError('Internal server error', 'http', 500) },
}

/** No response at all: backend down, offline, or blocked by CORS. */
export const NetworkError: Story = {
  args: {
    error: new ApiError('The server cannot be reached. Is the backend running?', 'network'),
    retryable: true,
  },
}

/** No response within the timeout (60 s; the free Render instance may be asleep). */
export const Timeout: Story = {
  args: {
    error: new ApiError('The server took too long to respond. Please try again.', 'timeout'),
    retryable: true,
  },
}
