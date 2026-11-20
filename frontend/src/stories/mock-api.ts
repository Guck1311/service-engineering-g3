import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { action } from 'storybook/actions'
import { http, USER_ID_HEADER } from '@/api/http'

/**
 * A fake backend for the stories.
 *
 * It replaces the ADAPTER of our axios instance: the part of axios that actually
 * sends the request. Everything above it stays real: services, the X-User-Id
 * interceptor and the conversion into ApiError. A story that answers with
 * `failWith(404)` therefore shows exactly what the app shows for a real 404.
 */

/** How the fake backend answers. */
export type MockReply =
  | { status: number; data?: unknown; delay?: number }
  | { network: true } // no response at all (backend down, offline)
  | { timeout: true } // no response within the timeout
  | { pending: true } // never answers: shows loading states

export interface MockRequest {
  method: string
  /** Path relative to the API base URL, e.g. "/music-items/6". */
  url: string
  params: Record<string, unknown>
  body: unknown
  /** Value of the X-User-Id header, set by our request interceptor. */
  userId: number | null
}

export interface MockRoute {
  /** HTTP method, or '*' for any. */
  method: string
  path: string | RegExp
  /** A function may return undefined to let the next matching route answer. */
  reply: MockReply | ((request: MockRequest) => MockReply | undefined)
}

// --- reply helpers ---

export const ok = (data?: unknown, delay?: number): MockReply => ({ status: 200, data, delay })

const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
}

/** An error response in the format of the backend's HttpExceptionFilter. */
export function failWith(status: number, message?: string | string[], delay?: number): MockReply {
  return {
    status,
    delay,
    data: {
      statusCode: status,
      error: STATUS_TEXT[status] ?? 'Error',
      message: message ?? STATUS_TEXT[status] ?? 'Error',
      path: '/api/v1/...',
      timestamp: new Date().toISOString(),
    },
  }
}

export const networkError: MockReply = { network: true }
export const timeout: MockReply = { timeout: true }
export const pending: MockReply = { pending: true }

// --- route helpers: get('/music-items/6', ok(item)) ---

const route =
  (method: string) =>
  (path: string | RegExp, reply: MockRoute['reply']): MockRoute => ({ method, path, reply })

export const get = route('GET')
export const post = route('POST')
export const put = route('PUT')
export const patch = route('PATCH')
export const del = route('DELETE')
// Any method. With a pattern that matches every URL and `networkError`, the whole backend is down.
export const anyRequest = route('*')

// --- the adapter ---

const DEFAULT_DELAY = 250 // ms, long enough to see spinners flash

let routes: MockRoute[] = []
const logRequest = action('api request')

function matches(r: MockRoute, request: MockRequest): boolean {
  if (r.method !== '*' && r.method !== request.method) return false
  return typeof r.path === 'string' ? r.path === request.url : r.path.test(request.url)
}

function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') return data
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

const adapter: AxiosAdapter = (config: InternalAxiosRequestConfig) => {
  const request: MockRequest = {
    method: (config.method ?? 'get').toUpperCase(),
    url: config.url ?? '',
    params: (config.params as Record<string, unknown>) ?? {},
    body: parseBody(config.data),
    userId: Number(config.headers.get(USER_ID_HEADER)) || null,
  }
  logRequest(`${request.method} ${request.url}`, request.params, request.body)

  // The first matching route that answers wins.
  let reply: MockReply | undefined
  for (const r of routes) {
    if (!matches(r, request)) continue
    reply = typeof r.reply === 'function' ? r.reply(request) : r.reply
    if (reply) break
  }
  reply ??= failWith(404, `No mock for ${request.method} ${request.url}`)
  const answer = reply

  return new Promise((resolve, reject) => {
    if ('pending' in answer) return // never settles

    if ('network' in answer) {
      setTimeout(() => reject(new AxiosError('Network Error', 'ERR_NETWORK', config)), 400)
      return
    }
    if ('timeout' in answer) {
      setTimeout(
        () => reject(new AxiosError('timeout exceeded', AxiosError.ECONNABORTED, config)),
        800,
      )
      return
    }

    const response: AxiosResponse = {
      status: answer.status,
      statusText: STATUS_TEXT[answer.status] ?? 'OK',
      data: answer.data,
      headers: new AxiosHeaders({ 'content-type': 'application/json' }),
      config,
    }
    setTimeout(() => {
      // What axios' own adapters do: 2xx resolves, everything else rejects.
      if (answer.status >= 200 && answer.status < 300) {
        resolve(response)
      } else {
        const code = answer.status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST'
        reject(
          new AxiosError(
            `Request failed with status code ${answer.status}`,
            code,
            config,
            null,
            response,
          ),
        )
      }
    }, answer.delay ?? DEFAULT_DELAY)
  })
}

/**
 * Sets the fake backend's routes for the current story. Earlier routes win,
 * so a story's own routes override the defaults from preview.ts.
 */
export function mockApi(...storyRoutes: MockRoute[]) {
  routes = [...storyRoutes, ...routes]
  http.defaults.adapter = adapter
}

/** Removes all routes (called before every story). */
export function resetMockApi(...defaultRoutes: MockRoute[]) {
  routes = [...defaultRoutes]
  http.defaults.adapter = adapter
}
