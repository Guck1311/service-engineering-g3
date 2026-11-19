import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/api/api-error'
import ToastHost from '@/components/ToastHost.vue'
import { describeError, useNotificationsStore } from '../notifications'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers() // control setTimeout: no real waiting in tests
})

afterEach(() => {
  vi.useRealTimers()
})

describe('notifications store', () => {
  it('dismisses toasts automatically, errors later than successes', () => {
    const store = useNotificationsStore()
    store.success('Saved.')
    store.error(new ApiError('Requires role ADMIN', 'http', 403))
    expect(store.notifications).toHaveLength(2)

    vi.advanceTimersByTime(3000)
    expect(store.notifications.map((n) => n.kind)).toEqual(['error'])

    vi.advanceTimersByTime(5000)
    expect(store.notifications).toHaveLength(0)
  })

  it('shows the API message and validation details', () => {
    const store = useNotificationsStore()
    store.error(
      new ApiError('Please check your input.', 'http', 400, ['title should not be empty']),
    )
    expect(store.notifications[0]).toMatchObject({
      kind: 'error',
      message: 'Please check your input.',
      details: ['title should not be empty'],
    })
  })

  it('ignores canceled requests', () => {
    const store = useNotificationsStore()
    store.error(new ApiError('The request was canceled.', 'canceled'))
    expect(store.notifications).toHaveLength(0)
  })

  it('does not stack identical messages', () => {
    const store = useNotificationsStore()
    const offline = new ApiError('The server cannot be reached.', 'network')
    store.error(offline)
    store.error(offline)
    store.error(offline)
    expect(store.notifications).toHaveLength(1)
  })

  it('keeps at most 4 toasts', () => {
    const store = useNotificationsStore()
    for (let i = 1; i <= 6; i++) store.info(`Message ${i}`)
    expect(store.notifications.map((n) => n.message)).toEqual([
      'Message 3',
      'Message 4',
      'Message 5',
      'Message 6',
    ])
  })

  it('hides technical messages of bugs from the user', () => {
    expect(
      describeError(new TypeError("Cannot read properties of undefined (reading 'id')")),
    ).toEqual({
      message: 'Something went wrong. Please try again.',
      details: [],
    })
  })
})

describe('ToastHost', () => {
  it('renders the toasts of the store and closes one on click', async () => {
    const store = useNotificationsStore()
    store.error(
      new ApiError('Please check your input.', 'http', 400, ['releaseYear must be an integer']),
    )
    const wrapper = mount(ToastHost)

    const toast = wrapper.get('.toast')
    expect(toast.attributes('role')).toBe('alert')
    expect(toast.text()).toContain('Please check your input.')
    expect(toast.text()).toContain('releaseYear must be an integer')

    await wrapper.get('.btn-close').trigger('click')
    expect(store.notifications).toHaveLength(0)
  })
})
