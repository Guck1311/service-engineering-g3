import {afterEach, describe, expect, it, vi} from 'vitest';
import {ApiError, request, setUserIdProvider} from '../http';

function mockFetch(response: Partial<Response> | Error) {
  const fetchMock =
    response instanceof Error
      ? vi.fn<typeof fetch>().mockRejectedValue(response)
      : vi
          .fn<typeof fetch>()
          .mockResolvedValue({ok: true, status: 200, ...response} as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setUserIdProvider(() => null);
  });

  it('sends the current user and leaves out empty query values', async () => {
    const fetchMock = mockFetch({json: async () => ({ok: 1})});
    setUserIdProvider(() => 2);

    await request('GET', '/music-items', {
      query: {type: 'ALBUM', search: '', page: undefined},
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/v1/music-items?type=ALBUM');
    expect((init!.headers as Record<string, string>)['X-User-Id']).toBe('2');
  });

  it('serializes the body as JSON', async () => {
    const fetchMock = mockFetch({status: 201, json: async () => ({})});

    await request('POST', '/music-items/1/comments', {body: {text: 'hi'}});

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init!.body).toBe('{"text":"hi"}');
    expect((init!.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json',
    );
  });

  it('returns undefined for 204 No Content', async () => {
    mockFetch({status: 204});
    await expect(request('DELETE', '/music-items/1')).resolves.toBeUndefined();
  });

  it('turns an error response into an ApiError with all messages', async () => {
    mockFetch({
      ok: false,
      status: 400,
      json: async () => ({
        statusCode: 400,
        error: 'Bad Request',
        message: [
          'stars must not be greater than 5',
          'stars must be an integer',
        ],
      }),
    });

    const error = (await request('PUT', '/x').catch(e => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.messages).toHaveLength(2);
  });

  it('reports an unreachable backend as status 0', async () => {
    mockFetch(new TypeError('Failed to fetch'));
    const error = (await request('GET', '/users').catch(e => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
  });
});
