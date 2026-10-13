import {request} from '@/api/http';
import type {Comment, Page, PageQuery} from '@/api/types';

/** REST calls for comments (`/music-items/{id}/comments`). */
export const commentsService = {
  /**
   * Lists the comments on an item, newest first.
   *
   * @param musicItemId - The commented item.
   * @param query - Pagination.
   */
  list(musicItemId: number, query: PageQuery = {}): Promise<Page<Comment>> {
    return request('GET', `/music-items/${musicItemId}/comments`, {
      query: {...query},
    });
  },

  /**
   * Comments on an item as the current user.
   *
   * @param musicItemId - The item to comment on.
   * @param text - Comment text, 1 to 2000 characters.
   */
  create(musicItemId: number, text: string): Promise<Comment> {
    return request('POST', `/music-items/${musicItemId}/comments`, {
      body: {text},
    });
  },
};
