import { http } from '@/api/http'
import type { Comment, CommentQuery, CreateComment, Page } from '@/api/types'

/** Comments on music items. */
export const commentsService = {
  /** GET /music-items/{id}/comments, newest first. */
  async list(musicItemId: number, query: CommentQuery = {}): Promise<Page<Comment>> {
    const { data } = await http.get<Page<Comment>>(`/music-items/${musicItemId}/comments`, {
      params: query,
    })
    return data
  },

  /** POST /music-items/{id}/comments as the current user. */
  async create(musicItemId: number, text: string): Promise<Comment> {
    const body: CreateComment = { text }
    const { data } = await http.post<Comment>(`/music-items/${musicItemId}/comments`, body)
    return data
  },
}
