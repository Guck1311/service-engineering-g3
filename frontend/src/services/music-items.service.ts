import {request} from '@/api/http';
import type {
  MusicItem,
  MusicItemDetail,
  MusicItemInput,
  MusicItemType,
  Page,
  PageQuery,
} from '@/api/types';

/** Filters of the catalogue list. */
export interface MusicItemQuery extends PageQuery {
  type?: MusicItemType;
  search?: string;
}

/** REST calls for the catalogue (`/music-items`). */
export const musicItemsService = {
  /**
   * Lists catalogue items.
   *
   * @param query - Filters and pagination.
   * @returns One page of items.
   */
  list(query: MusicItemQuery = {}): Promise<Page<MusicItem>> {
    return request('GET', '/music-items', {query: {...query}});
  },

  /**
   * Loads one item with its track list.
   *
   * @param id - Item id.
   */
  get(id: number): Promise<MusicItemDetail> {
    return request('GET', `/music-items/${id}`);
  },

  /**
   * Adds an item to the catalogue (admin only).
   *
   * @param input - The new item.
   */
  create(input: MusicItemInput): Promise<MusicItemDetail> {
    return request('POST', '/music-items', {body: input});
  },

  /**
   * Replaces an item and its track list (admin only).
   *
   * @param id - Item id.
   * @param input - The complete new state of the item.
   */
  replace(id: number, input: MusicItemInput): Promise<MusicItemDetail> {
    return request('PUT', `/music-items/${id}`, {body: input});
  },

  /**
   * Deletes an item; it also disappears from all collections (admin only).
   *
   * @param id - Item id.
   */
  remove(id: number): Promise<void> {
    return request('DELETE', `/music-items/${id}`);
  },
};
