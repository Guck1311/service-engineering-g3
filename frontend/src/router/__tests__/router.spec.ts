import { beforeEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import { usersService } from '@/services/users.service'
import { useSessionStore } from '@/stores/session'

vi.mock('@/services/users.service') // automock: every function becomes a vi.fn()

/** The app's real router (routes + guards), with an in-memory history. */
function makeRouter() {
  return createAppRouter(createMemoryHistory())
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.clearAllMocks()
  vi.mocked(usersService.list).mockResolvedValue([
    { id: 1, name: 'Admin', role: 'ADMIN' },
    { id: 2, name: 'Anna', role: 'USER' },
  ])
})

describe('admin guard', () => {
  it('redirects a normal user from admin pages to the catalogue', async () => {
    const router = makeRouter()
    await router.push('/catalogue/6/edit')

    expect(router.currentRoute.value.name).toBe('catalogue')
    expect(router.currentRoute.value.query.denied).toBe('/catalogue/6/edit')
  })

  it('lets the admin open admin pages', async () => {
    useSessionStore().switchUser(1)
    const router = makeRouter()
    await router.push('/catalogue/new')

    expect(router.currentRoute.value.name).toBe('item-create')
  })

  it('does not wait for the users on normal pages', async () => {
    const router = makeRouter()
    await router.push('/catalogue/6')

    expect(router.currentRoute.value.name).toBe('item-detail')
    expect(usersService.list).not.toHaveBeenCalled()
  })
})

describe('route table', () => {
  it('redirects / to the catalogue', async () => {
    const router = makeRouter()
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('catalogue')
  })

  it.each([
    ['/catalogue', 'catalogue'],
    ['/catalogue/new', 'item-create'],
    ['/catalogue/6', 'item-detail'],
    ['/catalogue/6/edit', 'item-edit'],
    ['/collection', 'my-collection'],
    ['/collections', 'all-collections'],
    ['/catalogue/abc', 'not-found'], // id must be numeric
    ['/does/not/exist', 'not-found'],
  ])('resolves %s to %s', (path, name) => {
    expect(makeRouter().resolve(path).name).toBe(name)
  })

  it('builds paths from route names', () => {
    const router = makeRouter()
    expect(router.resolve({ name: 'item-edit', params: { id: 6 } }).fullPath).toBe(
      '/catalogue/6/edit',
    )
    expect(router.resolve({ name: 'all-collections', query: { userId: '2' } }).fullPath).toBe(
      '/collections?userId=2',
    )
  })

  it('marks admin pages in the route meta', () => {
    const router = makeRouter()
    expect(router.resolve('/catalogue/new').meta.requiresAdmin).toBe(true)
    expect(router.resolve('/catalogue/6/edit').meta.requiresAdmin).toBe(true)
    expect(router.resolve('/catalogue/6').meta.requiresAdmin).toBeUndefined()
  })
})
