import {afterEach, describe, expect, it, vi} from 'vitest';
import {flushPromises, mount} from '@vue/test-utils';
import {createPinia, setActivePinia} from 'pinia';
import type {MusicItem, User} from '@/api/types';
import {setUserIdProvider} from '@/api/http';
import App from '@/App.vue';
import router from '@/router';
import {useSessionStore} from '@/stores/session';

const users: User[] = [
  {id: 1, name: 'Admin', role: 'ADMIN'},
  {id: 2, name: 'Anna', role: 'USER'},
];

const album: MusicItem = {
  id: 6,
  type: 'ALBUM',
  title: 'Abbey Road',
  artist: 'The Beatles',
  genre: 'Rock',
  releaseYear: 1969,
  durationSeconds: 626,
  externalUrl: null,
  trackCount: 3,
  averageRating: 4.5,
  ratingCount: 2,
  createdAt: '2026-10-13T21:13:25.000Z',
  updatedAt: '2026-10-13T21:13:25.000Z',
};

const page = <T>(data: T[]) => ({data, meta: {page: 1, limit: 20, total: 1}});

/** Fake backend that answers the calls made while the catalogue loads. */
function fakeBackend(url: string): unknown {
  if (url.startsWith('/api/v1/users/2/collection')) return page([]);
  if (url.startsWith('/api/v1/users')) return users;
  if (url.startsWith('/api/v1/music-items')) return page([album]);
  throw new Error(`Unexpected request ${url}`);
}

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('loads the users, selects one and shows the catalogue', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async input =>
        ({
          ok: true,
          status: 200,
          json: async () => fakeBackend(String(input)),
        }) as Response,
    );
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('music-collection.userId', '2');

    const pinia = createPinia();
    setActivePinia(pinia);
    const session = useSessionStore();
    setUserIdProvider(() => session.currentUserId);

    await router.push('/');
    const wrapper = mount(App, {global: {plugins: [pinia, router]}});
    await flushPromises();
    await flushPromises();

    expect(session.currentUser?.name).toBe('Anna');
    expect(wrapper.text()).toContain('Abbey Road');
    expect(wrapper.text()).toContain('My collection');
    expect(wrapper.text()).toContain('Add to collection');

    const itemsCall = fetchMock.mock.calls.find(([url]) =>
      String(url).startsWith('/api/v1/music-items'),
    );
    const headers = itemsCall![1]!.headers as Record<string, string>;
    expect(headers['X-User-Id']).toBe('2');
  });
});
