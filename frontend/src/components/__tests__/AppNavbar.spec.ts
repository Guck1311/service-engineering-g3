import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import AppNavbar from '../AppNavbar.vue'

function mountNavbar() {
  // RouterLinkStub replaces <RouterLink>, so the test needs no real router.
  return mount(AppNavbar, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

describe('AppNavbar', () => {
  it('renders the brand and the navigation entries', () => {
    const wrapper = mountNavbar()
    expect(wrapper.text()).toContain('Music Collection')
    expect(wrapper.text()).toContain('Catalogue')
  })

  it('toggles the mobile menu via reactive state', async () => {
    const wrapper = mountNavbar()
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
