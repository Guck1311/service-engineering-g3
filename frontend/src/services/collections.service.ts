import { http } from '@/api/http'
import type {
  AddCollectionEntry,
  AllCollectionsQuery,
  CollectionEntry,
  CollectionQuery,
  Page,
  UpdateCollectionEntry,
} from '@/api/types'

/** Personal collections: which user has which item, with reaction and favourite flag. */
export const collectionsService = {
  /** GET /collections: entries of all users. */
  async listAll(query: AllCollectionsQuery = {}): Promise<Page<CollectionEntry>> {
    const { data } = await http.get<Page<CollectionEntry>>('/collections', { params: query })
    return data
  },

  /** GET /users/{userId}/collection: entries of one user. */
  async listOfUser(userId: number, query: CollectionQuery = {}): Promise<Page<CollectionEntry>> {
    const { data } = await http.get<Page<CollectionEntry>>(`/users/${userId}/collection`, {
      params: query,
    })
    return data
  },

  /** POST /users/{userId}/collection: only allowed for the user's own collection. */
  async add(userId: number, musicItemId: number): Promise<CollectionEntry> {
    // Typed with the generated DTO: a renamed field in the backend becomes a compile error.
    const body: AddCollectionEntry = { musicItemId }
    const { data } = await http.post<CollectionEntry>(`/users/${userId}/collection`, body)
    return data
  },

  /** PATCH /users/{userId}/collection/{itemId}: set reaction and/or favourite. */
  async update(
    userId: number,
    musicItemId: number,
    changes: UpdateCollectionEntry,
  ): Promise<CollectionEntry> {
    const { data } = await http.patch<CollectionEntry>(
      `/users/${userId}/collection/${musicItemId}`,
      changes,
    )
    return data
  },

  /** DELETE /users/{userId}/collection/{itemId} */
  async remove(userId: number, musicItemId: number): Promise<void> {
    await http.delete(`/users/${userId}/collection/${musicItemId}`)
  },
}
