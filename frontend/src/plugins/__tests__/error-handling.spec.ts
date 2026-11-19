import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { ApiError } from '@/api/api-error'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import { useNotificationsStore } from '@/stores/notifications'
import { errorHandling } from '../error-handling'

let pinia: Pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  vi.spyOn(console, 'error').mockImplementation(() => {}) // bugs are logged; keep the output clean
})

const messages = () => useNotificationsStore().notifications.map((n) => n.message)

/** A button whose click handler fails like a store action would. */
const FailingButton = defineComponent({
  props: { error: { type: Object, required: true } },
  setup(props) {
    // async handler WITHOUT try/catch: it returns a rejected promise
    const onClick = async () => {
      throw props.error
    }
    return () => h('button', { onClick }, 'Add')
  },
})

describe('app.config.errorHandler', () => {
  it('shows a failed action as a toast, without try/catch in the component', async () => {
    const wrapper = mount(FailingButton, {
      props: { error: new ApiError('Music item 6 is already in the collection', 'http', 409) },
      global: { plugins: [pinia, errorHandling] },
    })

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(messages()).toEqual(['Music item 6 is already in the collection'])
    expect(console.error).not.toHaveBeenCalled() // expected API errors are not logged as bugs
  })

  it('shows a generic message for bugs and logs them', async () => {
    const wrapper = mount(FailingButton, {
      props: { error: new TypeError('x is undefined') },
      global: { plugins: [pinia, errorHandling] },
    })

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(messages()).toEqual(['Something went wrong. Please try again.'])
    expect(console.error).toHaveBeenCalled()
  })
})

describe('router.onError', () => {
  it('asks to reload when a lazy-loaded page cannot be downloaded', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { render: () => null } },
        {
          path: '/broken',
          // what the browser reports when an old chunk file no longer exists after a deploy
          component: () =>
            Promise.reject(
              new TypeError('Failed to fetch dynamically imported module: /assets/X.js'),
            ),
        },
      ],
    })
    mount(RouterView, { global: { plugins: [pinia, router, [errorHandling, { router }]] } })

    await router.push('/broken').catch(() => {})

    expect(useNotificationsStore().notifications[0]).toMatchObject({ kind: 'warning' })
    expect(messages()[0]).toContain('Please reload the page')
  })
})

describe('ErrorBoundary (onErrorCaptured)', () => {
  let shouldCrash = true

  /** Crashes while rendering until `shouldCrash` is false. */
  const Fragile = defineComponent({
    setup() {
      return () => {
        if (shouldCrash)
          throw new TypeError("Cannot read properties of undefined (reading 'title')")
        return h('p', 'Page content')
      }
    },
  })

  function mountInBoundary(child: ReturnType<typeof defineComponent>) {
    const router = createRouter({
      history: createMemoryHistory(),
      // the fallback links to the route named 'catalogue'
      routes: [{ path: '/', name: 'catalogue', component: { render: () => null } }],
    })
    return mount(ErrorBoundary, {
      slots: { default: () => h(child) },
      global: { plugins: [pinia, router, errorHandling] },
    })
  }

  it('shows a fallback instead of a blank page and recovers with "Try again"', async () => {
    shouldCrash = true
    const wrapper = mountInBoundary(Fragile)
    await flushPromises()

    expect(wrapper.text()).toContain('This page ran into a problem')

    shouldCrash = false
    await wrapper.get('button').trigger('click') // Try again
    await flushPromises()

    expect(wrapper.text()).toContain('Page content')
  })

  it('lets API errors pass through to the global handler (toast, no fallback)', async () => {
    const wrapper = mountInBoundary(
      defineComponent({
        setup() {
          return () => h(FailingButton, { error: new ApiError('Requires role ADMIN', 'http', 403) })
        },
      }),
    )

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('This page ran into a problem')
    expect(messages()).toEqual(['Requires role ADMIN'])
  })
})
