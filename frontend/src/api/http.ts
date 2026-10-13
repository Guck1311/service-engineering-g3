import type {ApiErrorBody} from './types';

/** Base URL of the REST API; the Vite dev server proxies `/api` to the backend. */
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

/**
 * Error thrown for every failed request, so components can handle all
 * failures the same way.
 */
export class ApiError extends Error {
  /**
   * @param status - HTTP status code, or 0 if the backend was not reachable.
   * @param messages - Messages from the backend; several for validation errors.
   */
  constructor(
    readonly status: number,
    readonly messages: string[],
  ) {
    super(messages.join(' '));
    this.name = 'ApiError';
  }

  /** Whether the request failed because the resource does not exist. */
  get isNotFound(): boolean {
    return this.status === 404;
  }
}

/** Query parameters; `undefined` and empty values are left out of the URL. */
export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

/** Options of a single request. */
export interface RequestOptions {
  query?: QueryParams;
  body?: unknown;
}

/** Returns the id of the current user, or `null` if none is selected. */
type UserIdProvider = () => number | null;

let userIdProvider: UserIdProvider = () => null;

/**
 * Registers where the HTTP client gets the current user from. Called once
 * in `main.ts` with the session store, so this module stays independent
 * of Pinia.
 *
 * @param provider - Function that returns the current user id.
 */
export function setUserIdProvider(provider: UserIdProvider): void {
  userIdProvider = provider;
}

/**
 * Sends a request to the backend and parses the JSON response.
 *
 * Adds the `X-User-Id` header of the current user, serializes the body as
 * JSON and converts error responses and network failures into an
 * {@link ApiError}.
 *
 * @param method - HTTP method.
 * @param path - Path below the API base URL, e.g. `/music-items/1`.
 * @param options - Query parameters and request body.
 * @returns The parsed response body; `undefined` for 204 No Content.
 * @throws ApiError if the request fails.
 */
export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {Accept: 'application/json'};
  const init: RequestInit = {method, headers};
  const userId = userIdProvider();
  if (userId !== null) {
    headers['X-User-Id'] = String(userId);
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(
      BASE_URL + path + toQueryString(options.query),
      init,
    );
  } catch {
    throw new ApiError(0, [
      'The server is not reachable. Is the backend running?',
    ]);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** Builds `?a=1&b=2` from the parameters that have a value. */
function toQueryString(query: QueryParams = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

/** Reads the backend's error body; falls back to the status text. */
async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    const messages = Array.isArray(body.message)
      ? body.message
      : [body.message];
    return new ApiError(response.status, messages);
  } catch {
    return new ApiError(response.status, [
      response.statusText || `Request failed with status ${response.status}`,
    ]);
  }
}
