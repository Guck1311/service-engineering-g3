import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import { http } from '@/api/http'
import { usersService } from '../users.service'
import { musicItemsService } from '../music-items.service'
import { collectionsService } from '../collections.service'
import { commentsService } from '../comments.service'
import { ratingsService } from '../ratings.service'

// Records every request instead of sending it and answers with `responseBody`.
const realAdapter = http.defaults.adapter
let request: InternalAxiosRequestConfig
let responseBody: unknown

beforeEach(() => {
  responseBody = { ok: true }
  http.defaults.adapter = async (config) => {
    request = config
    return { status: 200, statusText: 'OK', headers: {}, config, data: responseBody }
  }
})

afterEach(() => {
  http.defaults.adapter = realAdapter
})

/** Method, URL, query and parsed body of the recorded request. */
function sent() {
  return {
    method: request.method?.toUpperCase(),
    url: request.url,
    params: request.params,
    body: typeof request.data === 'string' ? JSON.parse(request.data) : request.data,
  }
}

describe('services map functions to endpoints', () => {
  it('returns the response body', async () => {
    responseBody = [{ id: 1, name: 'Admin', role: 'ADMIN' }]
    expect(await usersService.list()).toEqual(responseBody)
  })

  it.each([
    ['usersService.list', () => usersService.list(), 'GET', '/users'],
    ['musicItemsService.get', () => musicItemsService.get(6), 'GET', '/music-items/6'],
    ['musicItemsService.remove', () => musicItemsService.remove(6), 'DELETE', '/music-items/6'],
    ['collectionsService.listAll', () => collectionsService.listAll(), 'GET', '/collections'],
    [
      'collectionsService.listOfUser',
      () => collectionsService.listOfUser(2),
      'GET',
      '/users/2/collection',
    ],
    [
      'collectionsService.remove',
      () => collectionsService.remove(2, 6),
      'DELETE',
      '/users/2/collection/6',
    ],
    ['commentsService.list', () => commentsService.list(6), 'GET', '/music-items/6/comments'],
    ['ratingsService.summary', () => ratingsService.summary(6), 'GET', '/music-items/6/ratings'],
  ])('%s -> %s %s', async (_name, call, method, url) => {
    await call()
    expect(sent()).toMatchObject({ method, url })
  })

  it('sends list filters as query parameters', async () => {
    await musicItemsService.list({ type: 'ALBUM', search: 'road', page: 2, limit: 10 })
    expect(sent()).toMatchObject({
      method: 'GET',
      url: '/music-items',
      params: { type: 'ALBUM', search: 'road', page: 2, limit: 10 },
    })
  })

  it('sends request bodies as JSON', async () => {
    await musicItemsService.create({ type: 'TRACK', title: 'Yesterday', releaseYear: 1965 })
    expect(sent()).toMatchObject({
      method: 'POST',
      url: '/music-items',
      body: { type: 'TRACK', title: 'Yesterday', releaseYear: 1965 },
    })

    await musicItemsService.update(6, { type: 'ALBUM', title: 'Abbey Road', trackCount: 17 })
    expect(sent()).toMatchObject({ method: 'PUT', url: '/music-items/6', body: { trackCount: 17 } })

    await collectionsService.add(2, 6)
    expect(sent()).toMatchObject({
      method: 'POST',
      url: '/users/2/collection',
      body: { musicItemId: 6 },
    })

    await collectionsService.update(2, 6, { reaction: 'LIKE', favourite: true })
    expect(sent()).toMatchObject({
      method: 'PATCH',
      url: '/users/2/collection/6',
      body: { reaction: 'LIKE', favourite: true },
    })

    await commentsService.create(6, 'Great album!')
    expect(sent()).toMatchObject({ method: 'POST', body: { text: 'Great album!' } })

    await ratingsService.rate(6, 2, 5)
    expect(sent()).toMatchObject({
      method: 'PUT',
      url: '/music-items/6/ratings/2',
      body: { stars: 5 },
    })
  })
})
