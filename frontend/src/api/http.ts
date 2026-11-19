import axios from 'axios'
import { ApiError } from './api-error'

/** Name of the header that identifies the caller (there is no login, see backend README). */
export const USER_ID_HEADER = 'X-User-Id'

/**
 * The one configured axios instance of the app. Services use it instead of
 * calling `fetch` or `axios` directly, so base URL, headers and error handling
 * are defined in exactly one place.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // The backend on Render's free plan sleeps when idle and needs ~30-50 s to wake up.
  timeout: 60_000,
  headers: { Accept: 'application/json' },
})

// --- Who is calling? ---------------------------------------------------------
// The API layer must not import the Pinia store (that would couple it to the UI
// state). Instead, the store registers a function that returns the current id.

let currentUserId: () => number | null = () => null

/** Registers where the API layer gets the current user's id from (done by the session store). */
export function setUserIdProvider(provider: () => number | null) {
  currentUserId = provider
}

// --- Interceptors ------------------------------------------------------------

/** Request interceptor: runs before every request and adds the X-User-Id header. */
http.interceptors.request.use((config) => {
  const userId = currentUserId()
  if (userId !== null) config.headers.set(USER_ID_HEADER, String(userId))
  return config
})

/**
 * Response interceptor: successful responses pass through unchanged, every
 * failure is converted into an ApiError. Callers can rely on `catch (e)` always
 * receiving an ApiError.
 */
http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(ApiError.from(error)),
)
