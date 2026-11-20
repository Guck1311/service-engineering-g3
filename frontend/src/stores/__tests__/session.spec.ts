import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { ApiError } from '@/api/api-error'
import { http } from '@/api/http'
import type { User } from '@/api/types'
import { usersService } from '@/services/users.service'
import { DEFAULT_USER_ID, useSessionStore } from '../session'

// Replace the service module with a fake: the store is tested without HTTP.
vi.mock('@/services/users.service') // automock: every function becomes a vi.fn()

const USERS: User[] = [
  { id: 1, name: 'Admin', role: 'ADMIN' },
  { id: 2, name: 'Anna', role: 'USER' },
  { id: 3, name: 'Ben', role: 'USER' },
]

beforeEach(() => {
  // A fresh Pinia per test, so no state leaks between tests.
  setActivePinia(createPinia())
  localStorage.clear()
  vi.mocked(usersService.list).mockReset().mockResolvedValue(USERS)
})

describe('session store', () => {
  it('starts with the default user and loads the user list', async () => {
    const session = useSessionStore()
    expect(session.currentUserId).toBe(DEFAULT_USER_ID)
    expect(session.currentUser).toBeNull() // not loaded yet

    await session.ensureLoaded()

    expect(session.users).toHaveLength(3)
    expect(session.currentUser?.name).toBe('Anna')
    expect(session.isAdmin).toBe(false)
  })

  it('derives isAdmin from the selected user (getter)', async () => {
    const session = useSessionStore()
    await session.ensureLoaded()

    session.switchUser(1)

    expect(session.currentUser?.name).toBe('Admin')
    expect(session.isAdmin).toBe(true)
  })

  it('remembers the selected user in localStorage', async () => {
    useSessionStore().switchUser(3)
    await nextTick() // watchers run asynchronously

    setActivePinia(createPinia()) // simulates a page reload
    expect(useSessionStore().currentUserId).toBe(3)
  })

  it('loads the users only once', async () => {
    const session = useSessionStore()
    await Promise.all([session.ensureLoaded(), session.ensureLoaded()])
    await session.ensureLoaded()
    expect(usersService.list).toHaveBeenCalledTimes(1)
  })

  it('falls back to the default user if the remembered one no longer exists', async () => {
    localStorage.setItem('music-collection.userId', '99')
    vi.mocked(usersService.list)
      .mockRejectedValueOnce(new ApiError('Missing or invalid X-User-Id header', 'http', 401))
      .mockResolvedValueOnce(USERS)

    const session = useSessionStore()
    expect(session.currentUserId).toBe(99)
    await session.ensureLoaded()

    expect(session.currentUserId).toBe(DEFAULT_USER_ID)
    expect(session.error).toBeNull()
  })

  it('keeps the error and allows a retry when the backend is down', async () => {
    vi.mocked(usersService.list).mockRejectedValueOnce(
      new ApiError('The server cannot be reached.', 'network'),
    )
    const session = useSessionStore()

    await session.ensureLoaded()
    expect(session.error?.kind).toBe('network')

    await session.ensureLoaded() // retry
    expect(session.error).toBeNull()
    expect(session.users).toHaveLength(3)
  })

  it('makes the API layer send the current user id', async () => {
    const session = useSessionStore()
    session.switchUser(3)

    const realAdapter = http.defaults.adapter
    let header: unknown
    http.defaults.adapter = async (config) => {
      header = config.headers.get('X-User-Id')
      return { status: 200, statusText: 'OK', headers: {}, config, data: null }
    }
    try {
      await http.get('/anything')
    } finally {
      http.defaults.adapter = realAdapter
    }
    expect(header).toBe('3')
  })
})
