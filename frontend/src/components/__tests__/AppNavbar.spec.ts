import { beforeEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from '@/router'
import { collectionsService } from '@/services/collections.service'
import { usersService } from '@/services/users.service'
import { useCollectionStore } from '@/stores/collection'
import { useSessionStore } from '@/stores/session'
import AppNavbar from '../AppNavbar.vue'

vi.mock('@/services/users.service') // automock: every function becomes a vi.fn()
vi.mock('@/services/collections.service')

let pinia: Pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  localStorage.clear()
  vi.clearAllMocks()
  vi.mocked(usersService.list).mockResolvedValue([
    { id: 1, name: 'Admin', role: 'ADMIN' },
    { id: 2, name: 'Anna', role: 'USER' },
  ])
  vi.mocked(collectionsService.listOfUser).mockResolvedValue({
    data: [],
    meta: { page: 1, limit: 100, total: 0 },
  })
})

/** Mounts the navbar with our real route table, starting at `path`. */
async function mountNavbarAt(path: string) {
  // Memory history: no browser URL needed, ideal for tests.
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  return mount(AppNavbar, { global: { plugins: [router, pinia] } })
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

  it('shows the collection size from the store as a badge', async () => {
    const wrapper = await mountNavbarAt('/catalogue')
    expect(wrapper.find('.nav-link .badge').exists()).toBe(false) // empty collection

    // Any component changing the store updates the navbar.
    useCollectionStore().entries.push({} as never, {} as never)
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.nav-link .badge').text()).toBe('2')
  })

  it('switches the user via the session store', async () => {
    await useSessionStore().ensureLoaded()
    const wrapper = await mountNavbarAt('/catalogue')
    const select = wrapper.get<HTMLSelectElement>('#user-switcher')

    expect(select.findAll('option').map((o) => o.text())).toEqual(['Admin (admin)', 'Anna'])
    expect(select.element.value).toBe('2')
    expect(wrapper.text()).not.toContain('ADMIN')

    await select.setValue('1')

    expect(useSessionStore().currentUserId).toBe(1)
    expect(wrapper.get('.badge.text-bg-warning').text()).toBe('ADMIN')
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
