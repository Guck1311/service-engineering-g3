import type {
  CollectionEntry,
  Comment,
  MusicItem,
  Page,
  RatingSummary,
  Reaction,
  User,
} from '@/api/types'
import * as fx from './fixtures'
import {
  del,
  failWith,
  get,
  ok,
  patch,
  post,
  put,
  type MockReply,
  type MockRequest,
  type MockRoute,
} from './mock-api'

/**
 * An in-memory version of our NestJS backend, built from the seed data.
 *
 * It keeps state while a story is open (add an item to the collection, then open
 * "My collection": it is there) and applies the same rules as the real backend,
 * with the same error messages: X-User-Id required (401), own data only (403),
 * admin only (403), unknown ids (404), duplicates (409), validation (400).
 * Every story gets a fresh copy, created in .storybook/preview.ts.
 */

interface StoredEntry {
  userId: number
  musicItemId: number
  reaction: Reaction
  favourite: boolean
  addedAt: string
}
interface StoredComment {
  id: number
  userId: number
  musicItemId: number
  text: string
  createdAt: string
}
interface StoredRating {
  userId: number
  musicItemId: number
  stars: number
  updatedAt: string
}

const now = () => new Date().toISOString()

export function fakeBackend(): MockRoute[] {
  // --- state (a fresh copy per story) ---
  const items: MusicItem[] = structuredClone(fx.musicItems)
  let nextItemId = items.length + 1
  const entries: StoredEntry[] = [
    {
      userId: 2,
      musicItemId: 6,
      reaction: 'LIKE',
      favourite: true,
      addedAt: '2026-11-02T18:30:00.000Z',
    },
    {
      userId: 2,
      musicItemId: 4,
      reaction: 'NONE',
      favourite: false,
      addedAt: '2026-11-03T09:10:00.000Z',
    },
    {
      userId: 3,
      musicItemId: 7,
      reaction: 'DISLIKE',
      favourite: false,
      addedAt: '2026-11-04T12:00:00.000Z',
    },
    {
      userId: 3,
      musicItemId: 5,
      reaction: 'LIKE',
      favourite: true,
      addedAt: '2026-11-05T16:45:00.000Z',
    },
  ]
  const comments: StoredComment[] = [
    {
      id: 1,
      userId: 2,
      musicItemId: 6,
      text: 'Side B is a masterpiece.',
      createdAt: '2026-11-03T20:15:00.000Z',
    },
    {
      id: 2,
      userId: 3,
      musicItemId: 5,
      text: 'Still gives me chills.',
      createdAt: '2026-11-04T08:40:00.000Z',
    },
    {
      id: 3,
      userId: 1,
      musicItemId: 7,
      text: 'Curated for long drives.',
      createdAt: '2026-11-05T10:00:00.000Z',
    },
  ]
  let nextCommentId = comments.length + 1
  const ratings: StoredRating[] = [
    { userId: 2, musicItemId: 6, stars: 5, updatedAt: '2026-11-03T20:16:00.000Z' },
    { userId: 3, musicItemId: 6, stars: 4, updatedAt: '2026-11-04T08:41:00.000Z' },
    { userId: 3, musicItemId: 5, stars: 5, updatedAt: '2026-11-05T16:46:00.000Z' },
  ]

  // --- helpers ---
  const user = (id: number) => fx.users.find((u) => u.id === id)
  const segments = (request: MockRequest) => request.url.split('/').filter(Boolean)
  const idAt = (request: MockRequest, index: number) => Number(segments(request)[index])

  function summary(musicItemId: number): RatingSummary {
    const own = ratings.filter((r) => r.musicItemId === musicItemId)
    const average = own.length
      ? Math.round((own.reduce((sum, r) => sum + r.stars, 0) / own.length) * 10) / 10
      : null
    return {
      average,
      count: own.length,
      ratings: own.map((r) => ({
        musicItemId,
        user: user(r.userId)!,
        stars: r.stars,
        updatedAt: r.updatedAt,
      })),
    }
  }

  function itemDto(item: MusicItem): MusicItem {
    const { average, count } = summary(item.id)
    return { ...item, averageRating: average, ratingCount: count }
  }

  function entryDto(e: StoredEntry): CollectionEntry {
    return {
      user: user(e.userId)!,
      musicItem: itemDto(items.find((i) => i.id === e.musicItemId)!),
      reaction: e.reaction,
      favourite: e.favourite,
      addedAt: e.addedAt,
    }
  }

  function commentDto(c: StoredComment): Comment {
    return {
      id: c.id,
      musicItemId: c.musicItemId,
      user: user(c.userId)!,
      text: c.text,
      createdAt: c.createdAt,
    }
  }

  function paginate<T>(list: T[], params: Record<string, unknown>): Page<T> {
    const page = Number(params.page ?? 1)
    const limit = Number(params.limit ?? 20)
    return fx.page(list.slice((page - 1) * limit, page * limit), list.length, page, limit)
  }

  function findItem(id: number): MusicItem | MockReply {
    return items.find((i) => i.id === id) ?? failWith(404, `Music item ${id} not found`)
  }
  const isReply = (value: unknown): value is MockReply =>
    typeof value === 'object' && value !== null && 'status' in value && !('type' in value)

  /** Like the backend's AuthGuard: every request needs a known X-User-Id. */
  const auth =
    (handler: (request: MockRequest, caller: User) => MockReply) =>
    (request: MockRequest): MockReply => {
      if (request.userId === null) return failWith(401, 'Missing or invalid X-User-Id header')
      const caller = user(request.userId)
      if (!caller) return failWith(401, `Unknown user ${request.userId}`)
      return handler(request, caller)
    }

  const adminOnly = (handler: (request: MockRequest, caller: User) => MockReply) =>
    auth((request, caller) =>
      caller.role === 'ADMIN' ? handler(request, caller) : failWith(403, 'Requires role ADMIN'),
    )

  /** Like the backend's @OwnData(): users may only change their own collection and ratings. */
  const ownData = (
    handler: (request: MockRequest, caller: User) => MockReply,
    userIdIndex: number,
  ) =>
    auth((request, caller) =>
      idAt(request, userIdIndex) === caller.id
        ? handler(request, caller)
        : failWith(403, 'You can only modify your own data'),
    )

  function validateItem(body: Partial<MusicItem>): string[] {
    const errors: string[] = []
    if (!body.title?.trim()) errors.push('title should not be empty')
    if (body.releaseYear != null && (body.releaseYear < 1000 || body.releaseYear > 2100)) {
      errors.push('releaseYear must not be greater than 2100')
    }
    return errors
  }

  // --- routes ---
  return [
    get(
      '/users',
      auth(() => ok(fx.users)),
    ),

    // Catalogue
    get(
      '/music-items',
      auth((request) => {
        const { search, type } = request.params as { search?: string; type?: string }
        const term = search?.toLowerCase()
        const matching = items.filter(
          (i) =>
            (!type || i.type === type) &&
            (!term || `${i.title} ${i.artist ?? ''}`.toLowerCase().includes(term)),
        )
        return ok(paginate(matching.map(itemDto), request.params))
      }),
    ),
    post(
      '/music-items',
      adminOnly((request) => {
        const body = request.body as Partial<MusicItem>
        const errors = validateItem(body)
        if (errors.length) return failWith(400, errors)
        const created: MusicItem = {
          ...fx.musicItems[0]!,
          artist: null,
          genre: null,
          releaseYear: null,
          durationSeconds: null,
          externalUrl: null,
          trackCount: null,
          ...body,
          id: nextItemId++,
          createdAt: now(),
          updatedAt: now(),
        } as MusicItem
        items.push(created)
        return { status: 201, data: itemDto(created) }
      }),
    ),
    get(
      /^\/music-items\/\d+$/,
      auth((request) => {
        const item = findItem(idAt(request, 1))
        return isReply(item) ? item : ok(itemDto(item))
      }),
    ),
    put(
      /^\/music-items\/\d+$/,
      adminOnly((request) => {
        const item = findItem(idAt(request, 1))
        if (isReply(item)) return item
        const body = request.body as Partial<MusicItem>
        if (body.type !== item.type)
          return failWith(400, 'The type of a music item cannot be changed')
        const errors = validateItem(body)
        if (errors.length) return failWith(400, errors)
        Object.assign(item, {
          artist: null,
          genre: null,
          releaseYear: null,
          durationSeconds: null,
          externalUrl: null,
          trackCount: null,
          ...body,
          updatedAt: now(),
        })
        return ok(itemDto(item))
      }),
    ),
    del(
      /^\/music-items\/\d+$/,
      adminOnly((request) => {
        const id = idAt(request, 1)
        const index = items.findIndex((i) => i.id === id)
        if (index < 0) return failWith(404, `Music item ${id} not found`)
        items.splice(index, 1)
        for (let i = entries.length - 1; i >= 0; i--)
          if (entries[i]!.musicItemId === id) entries.splice(i, 1)
        return { status: 204 }
      }),
    ),

    // Comments
    get(
      /^\/music-items\/\d+\/comments$/,
      auth((request) => {
        const item = findItem(idAt(request, 1))
        if (isReply(item)) return item
        const own = comments
          .filter((c) => c.musicItemId === item.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        return ok(paginate(own.map(commentDto), request.params))
      }),
    ),
    post(
      /^\/music-items\/\d+\/comments$/,
      auth((request, caller) => {
        const item = findItem(idAt(request, 1))
        if (isReply(item)) return item
        const text = (request.body as { text?: string }).text?.trim() ?? ''
        if (!text) return failWith(400, ['text should not be empty'])
        const comment = {
          id: nextCommentId++,
          userId: caller.id,
          musicItemId: item.id,
          text,
          createdAt: now(),
        }
        comments.push(comment)
        return { status: 201, data: commentDto(comment) }
      }),
    ),

    // Ratings
    get(
      /^\/music-items\/\d+\/ratings$/,
      auth((request) => {
        const item = findItem(idAt(request, 1))
        return isReply(item) ? item : ok(summary(item.id))
      }),
    ),
    put(
      /^\/music-items\/\d+\/ratings\/\d+$/,
      ownData((request, caller) => {
        const item = findItem(idAt(request, 1))
        if (isReply(item)) return item
        const stars = Number((request.body as { stars?: number }).stars)
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
          return failWith(400, ['stars must not be greater than 5'])
        }
        const existing = ratings.find((r) => r.musicItemId === item.id && r.userId === caller.id)
        if (existing) Object.assign(existing, { stars, updatedAt: now() })
        else ratings.push({ userId: caller.id, musicItemId: item.id, stars, updatedAt: now() })
        return ok({ musicItemId: item.id, user: caller, stars, updatedAt: now() })
      }, 3),
    ),

    // Collections
    get(
      /^\/users\/\d+\/collection$/,
      auth((request) => {
        const userId = idAt(request, 1)
        if (!user(userId)) return failWith(404, `User ${userId} not found`)
        return ok(
          paginate(entries.filter((e) => e.userId === userId).map(entryDto), request.params),
        )
      }),
    ),
    post(
      /^\/users\/\d+\/collection$/,
      ownData((request, caller) => {
        const musicItemId = Number((request.body as { musicItemId?: number }).musicItemId)
        const item = findItem(musicItemId)
        if (isReply(item)) return item
        if (entries.some((e) => e.userId === caller.id && e.musicItemId === musicItemId)) {
          return failWith(409, `Music item ${musicItemId} is already in the collection`)
        }
        const stored: StoredEntry = {
          userId: caller.id,
          musicItemId,
          reaction: 'NONE',
          favourite: false,
          addedAt: now(),
        }
        entries.push(stored)
        return { status: 201, data: entryDto(stored) }
      }, 1),
    ),
    patch(
      /^\/users\/\d+\/collection\/\d+$/,
      ownData((request, caller) => {
        const musicItemId = idAt(request, 3)
        const stored = entries.find((e) => e.userId === caller.id && e.musicItemId === musicItemId)
        if (!stored) return failWith(404, `Music item ${musicItemId} is not in the collection`)
        const changes = request.body as { reaction?: Reaction; favourite?: boolean }
        const next = { ...stored, ...changes }
        if (next.reaction === 'DISLIKE' && next.favourite) {
          return failWith(400, 'A disliked item cannot be a favourite')
        }
        Object.assign(stored, next)
        return ok(entryDto(stored))
      }, 1),
    ),
    del(
      /^\/users\/\d+\/collection\/\d+$/,
      ownData((request, caller) => {
        const musicItemId = idAt(request, 3)
        const index = entries.findIndex(
          (e) => e.userId === caller.id && e.musicItemId === musicItemId,
        )
        if (index < 0) return failWith(404, `Music item ${musicItemId} is not in the collection`)
        entries.splice(index, 1)
        return { status: 204 }
      }, 1),
    ),
    get(
      '/collections',
      auth((request) => {
        const userId = Number(request.params.userId) || undefined
        const list = entries.filter((e) => !userId || e.userId === userId).map(entryDto)
        return ok(paginate(list, request.params))
      }),
    ),
  ]
}
