import {defineStore} from 'pinia';
import {computed, ref, watch} from 'vue';
import type {User} from '@/api/types';
import {usersService} from '@/services/users.service';

/** Key under which the selected user id is kept in `localStorage`. */
const STORAGE_KEY = 'music-collection.userId';

/**
 * The current user ("who am I").
 *
 * Login is not part of the exercise, so the user is picked from the seeded
 * users in the navbar. The choice survives page reloads via `localStorage`
 * and is sent to the backend as `X-User-Id` by the HTTP client.
 */
export const useSessionStore = defineStore('session', () => {
  const users = ref<User[]>([]);
  const currentUserId = ref<number | null>(readStoredUserId());

  /** The selected user, or `undefined` until the users are loaded. */
  const currentUser = computed(() =>
    users.value.find(user => user.id === currentUserId.value),
  );
  /** Whether the current user maintains the catalogue. */
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN');
  /** Whether the current user has a personal collection. */
  const isUser = computed(() => currentUser.value?.role === 'USER');

  watch(currentUserId, id => {
    try {
      if (id === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
      // Storage can be unavailable (e.g. private mode); the app still works.
    }
  });

  /**
   * Loads the seeded users and selects the first one if the stored id is
   * missing or no longer exists.
   */
  async function loadUsers(): Promise<void> {
    users.value = await usersService.list();
    if (!users.value.some(user => user.id === currentUserId.value)) {
      currentUserId.value = users.value[0]?.id ?? null;
    }
  }

  /**
   * Switches to another user.
   *
   * @param id - Id of a seeded user.
   */
  function switchUser(id: number): void {
    currentUserId.value = id;
  }

  return {
    users,
    currentUserId,
    currentUser,
    isAdmin,
    isUser,
    loadUsers,
    switchUser,
  };
});

/** Reads the stored user id; `null` if there is none or storage is blocked. */
function readStoredUserId(): number | null {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}
