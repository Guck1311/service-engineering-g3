import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { http, setUserIdProvider, USER_ID_HEADER } from '../http'
import { ApiError } from '../api-error'

// The adapter is the part of axios that actually sends the request. Replacing it
// lets the tests check our interceptors without a running backend.
const realAdapter = http.defaults.adapter
let lastRequest: InternalAxiosRequestConfig | undefined

function respondWith(status: number, data: unknown): AxiosAdapter {
  return async (config) => {
    lastRequest = config
    const response = { status, statusText: '', data, headers: {}, config }
    if (status >= 400) {
      throw new AxiosError('error', AxiosError.ERR_BAD_REQUEST, config, {}, response)
    }
    return response
  }
}

function failWith(code: string): AxiosAdapter {
  return async (config) => {
    throw new AxiosError('error', code, config, {}) // no response object
  }
}

async function catchError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (e) {
    return e as ApiError
  }
  throw new Error('expected the request to fail')
}

beforeEach(() => {
  lastRequest = undefined
  setUserIdProvider(() => null)
})

afterEach(() => {
  http.defaults.adapter = realAdapter
})

describe('request interceptor', () => {
  it('sends the current user id as X-User-Id', async () => {
    http.defaults.adapter = respondWith(200, [])
    setUserIdProvider(() => 2)

    await http.get('/users')

    expect(lastRequest?.headers.get(USER_ID_HEADER)).toBe('2')
  })

  it('omits the header when no user is selected', async () => {
    http.defaults.adapter = respondWith(200, [])

    await http.get('/users')

    expect(lastRequest?.headers.has(USER_ID_HEADER)).toBe(false)
  })
})

describe('response interceptor', () => {
  it('passes successful responses through', async () => {
    http.defaults.adapter = respondWith(200, { id: 1 })

    const response = await http.get('/music-items/1')

    expect(response.data).toEqual({ id: 1 })
  })

  it('turns a backend error into an ApiError with its message', async () => {
    http.defaults.adapter = respondWith(404, {
      statusCode: 404,
      error: 'Not Found',
      message: 'Music item 999 not found',
      path: '/api/v1/music-items/999',
      timestamp: '2026-11-19T17:43:00.231Z',
    })

    const error = await catchError(http.get('/music-items/999'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'http', status: 404, message: 'Music item 999 not found' })
    expect(error.isNotFound).toBe(true)
  })

  it('keeps the individual messages of a validation error', async () => {
    http.defaults.adapter = respondWith(400, {
      statusCode: 400,
      error: 'Bad Request',
      message: ['title should not be empty', 'releaseYear must be an integer number'],
    })

    const error = await catchError(http.post('/music-items', {}))

    expect(error.message).toBe('Please check your input.')
    expect(error.details).toEqual([
      'title should not be empty',
      'releaseYear must be an integer number',
    ])
  })

  it('falls back to the status when the body is not the backend format', async () => {
    http.defaults.adapter = respondWith(502, '<html>Bad Gateway</html>')

    const error = await catchError(http.get('/users'))

    expect(error).toMatchObject({ kind: 'http', status: 502 })
    expect(error.message).toBe('Request failed with status 502.')
  })

  it('reports an unreachable backend as a network error', async () => {
    http.defaults.adapter = failWith(AxiosError.ERR_NETWORK)

    const error = await catchError(http.get('/users'))

    expect(error).toMatchObject({ kind: 'network', status: 0 })
  })

  it('reports a timeout', async () => {
    http.defaults.adapter = failWith(AxiosError.ECONNABORTED)

    const error = await catchError(http.get('/users'))

    expect(error.kind).toBe('timeout')
  })
})
