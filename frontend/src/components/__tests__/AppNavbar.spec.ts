import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from '@/router'
import AppNavbar from '../AppNavbar.vue'

/** Mounts the navbar with our real route table, starting at `path`. */
async function mountNavbarAt(path: string) {
  // Memory history: no browser URL needed, ideal for tests.
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  return mount(AppNavbar, { global: { plugins: [router] } })
}

function activeLinks(wrapper: Awaited<ReturnType<typeof mountNavbarAt>>) {
  return wrapper.findAll('.nav-link.active').map((link) => link.text())
}

describe('AppNavbar', () => {
  it('renders the brand and the navigation entries', async () => {
    const wrapper = await mountNavbarAt('/catalogue')
    expect(wrapper.text()).toContain('Music Collection')
    expect(wrapper.findAll('.nav-link').map((l) => l.text())).toEqual([
      'Catalogue',
      'My collection',
      'All collections',
    ])
  })

  it('marks the section of the current page as active', async () => {
    expect(activeLinks(await mountNavbarAt('/catalogue'))).toEqual(['Catalogue'])
    expect(activeLinks(await mountNavbarAt('/catalogue/6'))).toEqual(['Catalogue'])
    // /collection must not match /collections and vice versa
    expect(activeLinks(await mountNavbarAt('/collection'))).toEqual(['My collection'])
    expect(activeLinks(await mountNavbarAt('/collections?userId=2'))).toEqual(['All collections'])
  })

  it('toggles the mobile menu via reactive state', async () => {
    const wrapper = await mountNavbarAt('/catalogue')
    const menu = wrapper.get('#main-nav')
    const toggler = wrapper.get('button.navbar-toggler')

    expect(menu.classes()).not.toContain('show')
    expect(toggler.attributes('aria-expanded')).toBe('false')

    await toggler.trigger('click') // await: wait until Vue has updated the DOM
    expect(menu.classes()).toContain('show')
    expect(toggler.attributes('aria-expanded')).toBe('true')

    await toggler.trigger('click')
    expect(menu.classes()).not.toContain('show')
  })
})
