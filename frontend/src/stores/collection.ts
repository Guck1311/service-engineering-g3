import { computed, ref, shallowRef, watch } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/api/api-error'
import type { CollectionEntry, Reaction, UpdateCollectionEntry } from '@/api/types'
import { collectionsService } from '@/services/collections.service'
import { useSessionStore } from './session'

/**
 * The current user's collection, shared by every component that shows it:
 * navbar badge, catalogue cards ("in collection"), detail page, "My collection".
 * A change made in one place is visible everywhere at once.
 */
export const useCollectionStore = defineStore('collection', () => {
  // A store can use other stores.
  const session = useSessionStore()

  // --- state ---
  const entries = ref<CollectionEntry[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = shallowRef<ApiError | null>(null)

  // --- getters ---
  /** Lookup by music item id; recomputed only when `entries` changes. */
  const byItemId = computed(() => new Map(entries.value.map((e) => [e.musicItem.id, e])))
  const count = computed(() => entries.value.length)

  function entryFor(musicItemId: number): CollectionEntry | undefined {
    return byItemId.value.get(musicItemId)
  }

  function has(musicItemId: number): boolean {
    return byItemId.value.has(musicItemId)
  }

  /** Replaces one entry immutably (a new array, so watchers and computeds notice). */
  function replaceEntry(entry: CollectionEntry) {
    entries.value = entries.value.map((e) => (e.musicItem.id === entry.musicItem.id ? entry : e))
  }

  // --- actions ---

  /** Loads all entries of the current user (the API returns at most 100 per page). */
  async function load(): Promise<void> {
    const userId = session.currentUserId
    loading.value = true
    error.value = null
    try {
      const all: CollectionEntry[] = []
      for (let page = 1; ; page++) {
        const result = await collectionsService.listOfUser(userId, { page, limit: 100 })
        all.push(...result.data)
        if (result.data.length === 0 || all.length >= result.meta.total) break
      }
      // The user may have switched while the request was running: drop the stale result.
      if (userId === session.currentUserId) {
        entries.value = all
        loaded.value = true
      }
    } catch (e) {
      error.value = ApiError.from(e)
    } finally {
      loading.value = false
    }
  }

  /** Adds a catalogue item. Throws ApiError (e.g. 409 if already in the collection). */
  async function add(musicItemId: number): Promise<CollectionEntry> {
    const entry = await collectionsService.add(session.currentUserId, musicItemId)
    entries.value = [entry, ...entries.value]
    return entry
  }

  /** Removes an item from the collection. Throws ApiError. */
  async function remove(musicItemId: number): Promise<void> {
    await collectionsService.remove(session.currentUserId, musicItemId)
    entries.value = entries.value.filter((e) => e.musicItem.id !== musicItemId)
  }

  /**
   * Optimistic update: show the change immediately, then send it. If the backend
   * rejects it, restore the previous entry and rethrow, so the UI can show the error.
   */
  async function update(musicItemId: number, changes: UpdateCollectionEntry) {
    const previous = entryFor(musicItemId)
    if (!previous) throw new ApiError('This item is not in your collection.', 'http', 404)

    replaceEntry({ ...previous, ...changes })
    try {
      const saved = await collectionsService.update(session.currentUserId, musicItemId, changes)
      replaceEntry(saved)
      return saved
    } catch (e) {
      replaceEntry(previous)
      throw ApiError.from(e)
    }
  }

  /**
   * The backend rejects "disliked + favourite" (400). Instead of letting that happen,
   * the store keeps the combination valid: disliking removes the favourite flag.
   * Reacting to an item that is not in the collection adds it first (POST, then PATCH).
   * Resetting the reaction keeps the item: removing stays an explicit action.
   */
  async function setReaction(musicItemId: number, reaction: Reaction) {
    if (!has(musicItemId)) await add(musicItemId)
    return update(
      musicItemId,
      reaction === 'DISLIKE' ? { reaction, favourite: false } : { reaction },
    )
  }

  /** ...and marking a disliked item as favourite resets the dislike. */
  async function toggleFavourite(musicItemId: number) {
    if (!has(musicItemId)) await add(musicItemId)
    const entry = entryFor(musicItemId)
    if (!entry) throw new ApiError('This item is not in your collection.', 'http', 404)
    const favourite = !entry.favourite
    return update(
      musicItemId,
      favourite && entry.reaction === 'DISLIKE' ? { favourite, reaction: 'NONE' } : { favourite },
    )
  }

  // Another user selected: the old collection is no longer valid.
  watch(
    () => session.currentUserId,
    () => {
      entries.value = []
      loaded.value = false
      void load()
    },
  )

  return {
    entries,
    loading,
    loaded,
    error,
    count,
    entryFor,
    has,
    load,
    add,
    remove,
    update,
    setReaction,
    toggleFavourite,
  }
})
