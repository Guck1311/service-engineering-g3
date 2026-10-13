import {request} from '@/api/http';
import type {Rating, RatingSummary} from '@/api/types';

/** REST calls for ratings (`/music-items/{id}/ratings`). */
export const ratingsService = {
  /**
   * Loads the average, the count and all ratings of an item.
   *
   * @param musicItemId - The rated item.
   */
  get(musicItemId: number): Promise<RatingSummary> {
    return request('GET', `/music-items/${musicItemId}/ratings`);
  },

  /**
   * Creates or replaces the current user's rating.
   *
   * @param musicItemId - The item to rate.
   * @param userId - The current user.
   * @param stars - 1 to 5.
   */
  rate(musicItemId: number, userId: number, stars: number): Promise<Rating> {
    return request('PUT', `/music-items/${musicItemId}/ratings/${userId}`, {
      body: {stars},
    });
  },
};
