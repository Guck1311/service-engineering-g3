import {defineStore} from 'pinia';
import {computed, ref, watch} from 'vue';
import type {CollectionEntry, CollectionEntryPatch} from '@/api/types';
import {collectionsService} from '@/services/collections.service';
import {useNotificationsStore} from './notifications';
import {useSessionStore} from './session';

/** Upper limit of the backend's page size; enough for a personal collection. */
const MAX_PAGE_SIZE = 100;

/**
 * The current user's personal collection, shared by all views.
 *
 * The catalogue uses it to show "in your collection" badges, the detail
 * view to show the like/dislike/favourite controls, and "My collection" to
 * list the entries. Because every view reads the same state, a change in
 * one place shows up everywhere without reloading.
 */
export const useCollectionStore = defineStore('collection', () => {
  const session = useSessionStore();
  const notifications = useNotificationsStore();

  /** Entries keyed by music item id. */
  const entries = ref(new Map<number, CollectionEntry>());
  const loaded = ref(false);

  /** All entries, newest first. */
  const list = computed(() =>
    [...entries.value.values()].sort((a, b) =>
      b.addedAt.localeCompare(a.addedAt),
    ),
  );

  /**
   * Returns the entry for an item, if the item is in the collection.
   *
   * @param musicItemId - The item to look up.
   */
  function entryFor(musicItemId: number): CollectionEntry | undefined {
    return entries.value.get(musicItemId);
  }

  /** Loads the current user's collection; admins have none. */
  async function load(): Promise<void> {
    entries.value = new Map();
    loaded.value = false;
    const userId = session.currentUserId;
    if (userId === null || !session.isUser) {
      loaded.value = true;
      return;
    }
    const page = await collectionsService.listForUser(userId, {
      limit: MAX_PAGE_SIZE,
    });
    entries.value = new Map(
      page.data.map(entry => [entry.musicItem.id, entry]),
    );
    loaded.value = true;
  }

  /**
   * Adds a catalogue item to the collection.
   *
   * @param musicItemId - The item to add.
   */
  async function add(musicItemId: number): Promise<void> {
    const entry = await collectionsService.add(requireUserId(), musicItemId);
    entries.value.set(musicItemId, entry);
  }

  /**
   * Changes the reaction and/or favourite flag of an entry.
   *
   * @param musicItemId - The collected item.
   * @param patch - Fields to change.
   */
  async function update(
    musicItemId: number,
    patch: CollectionEntryPatch,
  ): Promise<void> {
    const entry = await collectionsService.update(
      requireUserId(),
      musicItemId,
      patch,
    );
    entries.value.set(musicItemId, entry);
  }

  /**
   * Removes an item from the collection.
   *
   * @param musicItemId - The item to remove.
   */
  async function remove(musicItemId: number): Promise<void> {
    await collectionsService.remove(requireUserId(), musicItemId);
    entries.value.delete(musicItemId);
  }

  /**
   * Forgets a deleted catalogue item; the backend already removed it from
   * all collections.
   *
   * @param musicItemId - The deleted item.
   */
  function forget(musicItemId: number): void {
    entries.value.delete(musicItemId);
  }

  /** Returns the current user id or throws if no user is selected. */
  function requireUserId(): number {
    if (session.currentUserId === null) {
      throw new Error('No user selected');
    }
    return session.currentUserId;
  }

  // Reload whenever another user is selected (or the users finish loading).
  watch(
    () => [session.currentUserId, session.currentUser?.role],
    () =>
      void load().catch(error => {
        loaded.value = true;
        notifications.error(error);
      }),
    {immediate: true},
  );

  return {entries, loaded, list, entryFor, load, add, update, remove, forget};
});
