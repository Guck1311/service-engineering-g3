import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { createMemoryHistory, RouterView } from 'vue-router'
import { ApiError } from '@/api/api-error'
import type { MusicItem } from '@/api/types'
import { createAppRouter } from '@/router'
import { musicItemsService } from '@/services/music-items.service'

vi.mock('@/services/music-items.service')
vi.mock('@/services/users.service')
vi.mock('@/services/collections.service')

function item(id: number, title: string, type: MusicItem['type'] = 'TRACK'): MusicItem {
  return {
    id,
    type,
    title,
    artist: 'The Beatles',
    genre: null,
    releaseYear: 1969,
    durationSeconds: null,
    externalUrl: null,
    averageRating: null,
    ratingCount: 0,
    trackCount: null,
    createdAt: '2026-11-19T00:00:00.000Z',
    updatedAt: '2026-11-19T00:00:00.000Z',
  }
}

let pinia: Pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  vi.clearAllMocks()
  vi.mocked(musicItemsService.list).mockResolvedValue({
    data: [item(1, 'Come Together'), item(6, 'Abbey Road', 'ALBUM')],
    meta: { page: 1, limit: 12, total: 2 },
  })
})

/** Renders the real router (routes, props from the query) at `path`. */
async function renderAt(path: string) {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  const wrapper = mount(RouterView, { global: { plugins: [router, pinia] } })
  await flushPromises() // let the service promise resolve and Vue re-render
  return { wrapper, router }
}

describe('CatalogueView', () => {
  it('loads and shows the items', async () => {
    const { wrapper } = await renderAt('/catalogue')

    expect(musicItemsService.list).toHaveBeenCalledWith({
      search: undefined,
      type: undefined,
      page: 1,
      limit: 12,
    })
    expect(wrapper.findAll('article.card')).toHaveLength(2)
    expect(wrapper.text()).toContain('2 items')
  })

  it('passes the filters from the URL to the service', async () => {
    await renderAt('/catalogue?type=ALBUM&search=road&page=2')

    expect(musicItemsService.list).toHaveBeenCalledWith({
      search: 'road',
      type: 'ALBUM',
      page: 2,
      limit: 12,
    })
  })

  it('writes a type filter into the URL and reloads', async () => {
    const { wrapper, router } = await renderAt('/catalogue')

    const albums = wrapper.findAll('button').find((b) => b.text() === 'Albums')!
    await albums.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ type: 'ALBUM' })
    expect(musicItemsService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'ALBUM' }),
    )
  })

  it('shows an error with a retry button', async () => {
    vi.mocked(musicItemsService.list).mockRejectedValueOnce(
      new ApiError('The server cannot be reached. Is the backend running?', 'network'),
    )
    const { wrapper } = await renderAt('/catalogue')

    expect(wrapper.get('.alert-danger').text()).toContain('The server cannot be reached')

    await wrapper.get('.alert-danger button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.alert-danger').exists()).toBe(false)
    expect(wrapper.findAll('article.card')).toHaveLength(2)
  })
})
