import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { ApiError } from '@/api/api-error'
import type { CollectionEntry, MusicItem } from '@/api/types'
import { collectionsService } from '@/services/collections.service'
import { useCollectionStore } from '../collection'
import { useSessionStore } from '../session'

vi.mock('@/services/collections.service')
vi.mock('@/services/users.service') // automock: every function becomes a vi.fn()

const service = vi.mocked(collectionsService)

function item(id: number): MusicItem {
  return {
    id,
    type: 'TRACK',
    title: `Track ${id}`,
    artist: null,
    genre: null,
    releaseYear: null,
    durationSeconds: null,
    externalUrl: null,
    averageRating: null,
    ratingCount: 0,
    trackCount: null,
    createdAt: '2026-11-19T00:00:00.000Z',
    updatedAt: '2026-11-19T00:00:00.000Z',
  }
}

function entry(id: number, changes: Partial<CollectionEntry> = {}): CollectionEntry {
  return {
    user: { id: 2, name: 'Anna', role: 'USER' },
    musicItem: item(id),
    reaction: 'NONE',
    favourite: false,
    addedAt: '2026-11-19T00:00:00.000Z',
    ...changes,
  }
}

function page(entries: CollectionEntry[]) {
  return { data: entries, meta: { page: 1, limit: 100, total: entries.length } }
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.resetAllMocks()
  service.listOfUser.mockResolvedValue(page([entry(4), entry(6, { favourite: true })]))
})

describe('collection store', () => {
  it('loads the collection of the current user', async () => {
    const collection = useCollectionStore()
    await collection.load()

    expect(service.listOfUser).toHaveBeenCalledWith(2, { page: 1, limit: 100 })
    expect(collection.count).toBe(2)
    expect(collection.has(6)).toBe(true)
    expect(collection.has(1)).toBe(false)
  })

  it('adds and removes entries', async () => {
    const collection = useCollectionStore()
    await collection.load()

    service.add.mockResolvedValue(entry(1))
    await collection.add(1)
    expect(collection.count).toBe(3)
    expect(collection.has(1)).toBe(true)

    service.remove.mockResolvedValue()
    await collection.remove(4)
    expect(collection.has(4)).toBe(false)
    expect(collection.count).toBe(2)
  })

  it('updates optimistically: the change is visible before the backend answers', async () => {
    const collection = useCollectionStore()
    await collection.load()

    let answer!: (value: CollectionEntry) => void
    service.update.mockReturnValue(new Promise((resolve) => (answer = resolve)))

    const saving = collection.setReaction(4, 'LIKE')
    expect(collection.entryFor(4)?.reaction).toBe('LIKE') // already shown

    answer(entry(4, { reaction: 'LIKE' }))
    await saving
    expect(collection.entryFor(4)?.reaction).toBe('LIKE')
  })

  it('rolls back an optimistic update the backend rejects', async () => {
    const collection = useCollectionStore()
    await collection.load()
    service.update.mockRejectedValue(new ApiError('Server error', 'http', 500))

    await expect(collection.toggleFavourite(4)).rejects.toMatchObject({ status: 500 })

    expect(collection.entryFor(4)?.favourite).toBe(false) // restored
  })

  it('keeps reaction and favourite consistent with the backend rule', async () => {
    const collection = useCollectionStore()
    await collection.load()
    service.update.mockImplementation(async (_user, id, changes) => entry(id, changes))

    // disliking a favourite also removes the favourite flag
    await collection.setReaction(6, 'DISLIKE')
    expect(service.update).toHaveBeenLastCalledWith(2, 6, { reaction: 'DISLIKE', favourite: false })

    // marking a disliked item as favourite resets the dislike
    await collection.toggleFavourite(6)
    expect(service.update).toHaveBeenLastCalledWith(2, 6, { favourite: true, reaction: 'NONE' })
  })

  it('adds an item before reacting to it, and keeps it when the reaction is reset', async () => {
    const collection = useCollectionStore()
    await collection.load()
    service.add.mockResolvedValue(entry(1))
    service.update.mockImplementation(async (_user, id, changes) => entry(id, changes))

    await collection.setReaction(1, 'LIKE')
    expect(service.add).toHaveBeenCalledWith(2, 1) // POST first
    expect(service.update).toHaveBeenLastCalledWith(2, 1, { reaction: 'LIKE' }) // then PATCH
    expect(collection.entryFor(1)?.reaction).toBe('LIKE')

    await collection.setReaction(1, 'NONE')
    expect(collection.has(1)).toBe(true) // still in the collection
    expect(service.add).toHaveBeenCalledTimes(1) // no second POST
  })

  it('reloads when another user is selected', async () => {
    const collection = useCollectionStore()
    await collection.load()

    service.listOfUser.mockResolvedValue(page([entry(7)]))
    useSessionStore().switchUser(3)
    await nextTick() // the store's watcher runs
    await vi.waitFor(() => expect(collection.loading).toBe(false))

    expect(service.listOfUser).toHaveBeenLastCalledWith(3, { page: 1, limit: 100 })
    expect(collection.count).toBe(1)
  })
})
