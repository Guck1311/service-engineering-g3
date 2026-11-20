import { computed, ref, shallowRef, watch } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/api/api-error'
import { setUserIdProvider } from '@/api/http'
import type { User } from '@/api/types'
import { usersService } from '@/services/users.service'

/** Seeded user selected on the first visit: 2 = Anna (role USER). */
export const DEFAULT_USER_ID = 2

const STORAGE_KEY = 'music-collection.userId'

// localStorage can be unavailable (private mode, blocked cookies): never let that break the app.
function readStoredUserId(): number | null {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function storeUserId(id: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(id))
  } catch {
    // ignore: the choice is just not remembered
  }
}

/**
 * Who is using the app. There is no login (see assignment): the user picks one of
 * the seeded users in the navbar, and every request is sent as that user.
 *
 * Written as a "setup store": the same Composition API as in components
 * (ref = state, computed = getters, functions = actions).
 */
export const useSessionStore = defineStore('session', () => {
  // --- state ---
  const users = ref<User[]>([])
  const currentUserId = ref<number>(readStoredUserId() ?? DEFAULT_USER_ID)
  const error = shallowRef<ApiError | null>(null)

  // --- getters ---
  const currentUser = computed(() => users.value.find((u) => u.id === currentUserId.value) ?? null)
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')

  // Connect the API layer: every request now carries X-User-Id of the current user.
  setUserIdProvider(() => currentUserId.value)

  // Remember the choice across page reloads.
  watch(currentUserId, storeUserId)

  // --- actions ---

  /** Loads the user list. GET /users itself needs a valid X-User-Id. */
  async function loadUsers(): Promise<void> {
    try {
      users.value = await usersService.list()
      error.value = null
    } catch (e) {
      const err = ApiError.from(e)
      // The remembered id may not exist anymore (e.g. the backend database was reset):
      // fall back to the default user once and try again.
      if (err.status === 401 && currentUserId.value !== DEFAULT_USER_ID) {
        currentUserId.value = DEFAULT_USER_ID
        return loadUsers()
      }
      error.value = err
      return
    }
    const first = users.value[0]
    if (!currentUser.value && first) currentUserId.value = first.id
  }

  let usersLoaded: Promise<void> | null = null

  /** Loads the users once; later calls reuse the same promise (e.g. from the router guard). */
  function ensureLoaded(): Promise<void> {
    usersLoaded ??= loadUsers().then(() => {
      if (error.value) usersLoaded = null // allow a retry after a failure
    })
    return usersLoaded
  }

  function switchUser(id: number) {
    currentUserId.value = id
  }

  return { users, currentUserId, currentUser, isAdmin, error, loadUsers, ensureLoaded, switchUser }
})
