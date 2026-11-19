import { describe, it, expect } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from '@/router'

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes })
}

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
