import {request} from '@/api/http';
import type {
  CollectionEntry,
  CollectionEntryPatch,
  Page,
  PageQuery,
  Reaction,
} from '@/api/types';

/** Filters of the collection lists. */
export interface CollectionQuery extends PageQuery {
  reaction?: Reaction;
  favourite?: boolean;
}

/** REST calls for the personal collections. */
export const collectionsService = {
  /**
   * Lists the collection entries of all users.
   *
   * @param query - Filters and pagination.
   */
  listAll(query: CollectionQuery = {}): Promise<Page<CollectionEntry>> {
    return request('GET', '/collections', {query: {...query}});
  },

  /**
   * Lists the collection of one user.
   *
   * @param userId - Owner of the collection.
   * @param query - Filters and pagination.
   */
  listForUser(
    userId: number,
    query: CollectionQuery = {},
  ): Promise<Page<CollectionEntry>> {
    return request('GET', `/users/${userId}/collection`, {query: {...query}});
  },

  /**
   * Adds a catalogue item to the user's own collection.
   *
   * @param userId - Owner of the collection (the current user).
   * @param musicItemId - The item to add.
   */
  add(userId: number, musicItemId: number): Promise<CollectionEntry> {
    return request('POST', `/users/${userId}/collection`, {
      body: {musicItemId},
    });
  },

  /**
   * Changes the reaction and/or favourite flag of an entry.
   *
   * @param userId - Owner of the collection (the current user).
   * @param musicItemId - The collected item.
   * @param patch - Fields to change.
   */
  update(
    userId: number,
    musicItemId: number,
    patch: CollectionEntryPatch,
  ): Promise<CollectionEntry> {
    return request('PATCH', `/users/${userId}/collection/${musicItemId}`, {
      body: patch,
    });
  },

  /**
   * Removes an item from the user's own collection.
   *
   * @param userId - Owner of the collection (the current user).
   * @param musicItemId - The item to remove.
   */
  remove(userId: number, musicItemId: number): Promise<void> {
    return request('DELETE', `/users/${userId}/collection/${musicItemId}`);
  },
};
