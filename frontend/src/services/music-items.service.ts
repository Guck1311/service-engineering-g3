import { http } from '@/api/http'
import type { CreateMusicItem, MusicItem, MusicItemQuery, Page, UpdateMusicItem } from '@/api/types'

/**
 * The catalogue: tracks, albums and playlists.
 *
 * A service is plain TypeScript without Vue: it knows the endpoints and their
 * types and returns the response body. It holds no state and shows no UI.
 */
export const musicItemsService = {
  /** GET /music-items?page&limit&type&search */
  async list(query: MusicItemQuery = {}): Promise<Page<MusicItem>> {
    const { data } = await http.get<Page<MusicItem>>('/music-items', { params: query })
    return data
  },

  /** GET /music-items/{id} */
  async get(id: number): Promise<MusicItem> {
    const { data } = await http.get<MusicItem>(`/music-items/${id}`)
    return data
  },

  /** POST /music-items (admin) */
  async create(item: CreateMusicItem): Promise<MusicItem> {
    const { data } = await http.post<MusicItem>('/music-items', item)
    return data
  },

  /** PUT /music-items/{id} (admin); replaces the whole item. */
  async update(id: number, item: UpdateMusicItem): Promise<MusicItem> {
    const { data } = await http.put<MusicItem>(`/music-items/${id}`, item)
    return data
  },

  /** DELETE /music-items/{id} (admin); also removes it from all collections. */
  async remove(id: number): Promise<void> {
    await http.delete(`/music-items/${id}`)
  },
}
