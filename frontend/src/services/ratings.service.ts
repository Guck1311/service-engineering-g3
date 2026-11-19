import { http } from '@/api/http'
import type { Rating, RatingSummary } from '@/api/types'

/** 1-5 star ratings; one per user and item. */
export const ratingsService = {
  /** GET /music-items/{id}/ratings: average, count and all individual ratings. */
  async summary(musicItemId: number): Promise<RatingSummary> {
    const { data } = await http.get<RatingSummary>(`/music-items/${musicItemId}/ratings`)
    return data
  },

  /** PUT /music-items/{id}/ratings/{userId}: creates or replaces the user's own rating. */
  async rate(musicItemId: number, userId: number, stars: number): Promise<Rating> {
    const { data } = await http.put<Rating>(`/music-items/${musicItemId}/ratings/${userId}`, {
      stars,
    })
    return data
  },
}
