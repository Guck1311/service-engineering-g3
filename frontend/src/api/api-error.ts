import { isAxiosError, isCancel } from 'axios'
import type { ApiErrorBody } from './types'

/**
 * What went wrong:
 * - `http`:     the backend answered with an error status (4xx/5xx)
 * - `network`:  no answer at all (backend down, offline, CORS)
 * - `timeout`:  no answer within the configured timeout
 * - `canceled`: the request was aborted on purpose (e.g. the user left the page)
 */
export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'canceled'

/**
 * The only error type the rest of the app sees from the API layer.
 *
 * Components and stores never deal with axios internals or the backend's raw
 * error JSON; they get a readable `message` and, for validation errors, the
 * individual `details`.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    /** HTTP status, 0 if there was no response. */
    readonly status: number = 0,
    /** Individual validation messages of a 400 response. */
    readonly details: string[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isNotFound() {
    return this.status === 404
  }

  get isForbidden() {
    return this.status === 401 || this.status === 403
  }

  /** Converts anything thrown by axios into an ApiError. */
  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error
    if (isCancel(error)) return new ApiError('The request was canceled.', 'canceled')
    if (!isAxiosError(error)) {
      return new ApiError(error instanceof Error ? error.message : String(error), 'network')
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('The server took too long to respond. Please try again.', 'timeout')
    }

    const response = error.response
    if (!response) {
      return new ApiError('The server cannot be reached. Is the backend running?', 'network')
    }

    // The backend's HttpExceptionFilter sends { statusCode, error, message, path, timestamp };
    // `message` is a string, or a list of strings for validation errors.
    const body = response.data as Partial<ApiErrorBody> | undefined
    const raw = body?.message
    const details = Array.isArray(raw) ? raw : []
    const message =
      (typeof raw === 'string' && raw) ||
      (details.length > 0 && 'Please check your input.') ||
      body?.error ||
      `Request failed with status ${response.status}.`

    return new ApiError(message, 'http', response.status, details)
  }
}
