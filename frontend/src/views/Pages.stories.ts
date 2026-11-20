import type { Meta, StoryObj } from '@storybook/vue3-vite'
import App from '@/App.vue'
import { admin, ben } from '@/stories/fixtures'
import { anyRequest, failWith, get, mockApi, networkError, pending } from '@/stories/mock-api'
import { actAs } from '@/stories/state'

/**
 * The complete app (App.vue: navbar, banner, error boundary, router view, toasts)
 * on the fake backend. Everything is clickable: navigate, filter, add to the
 * collection, rate, comment. Changes last until another story is opened.
 *
 * `parameters.route` sets the start URL (see .storybook/preview.ts).
 */
const meta = {
  title: 'Pages/Full app',
  component: App,
  parameters: { layout: 'fullscreen', route: '/catalogue' },
} satisfies Meta<typeof App>

export default meta
type Story = StoryObj<typeof meta>

// --- Catalogue ---

export const Catalogue: Story = {}

/** The admin also sees "New item". */
export const CatalogueAsAdmin: Story = {
  beforeEach() {
    actAs(admin)
  },
}

/** Filters live in the URL query. */
export const CatalogueFiltered: Story = {
  parameters: { route: '/catalogue?type=TRACK&search=the' },
}

export const CatalogueNoResults: Story = { parameters: { route: '/catalogue?search=xyz' } }

export const CatalogueLoading: Story = {
  beforeEach() {
    mockApi(get('/music-items', pending))
  },
}

/** Loading the list fails: ErrorAlert with Retry, the rest of the app keeps working. */
export const CatalogueLoadFails: Story = {
  beforeEach() {
    mockApi(get('/music-items', failWith(500, 'Internal server error')))
  },
}

/** Anna opened /catalogue/new: the admin guard redirected her to the catalogue with a notice. */
export const AdminPageDenied: Story = { parameters: { route: '/catalogue/new' } }

// --- Detail ---

export const MusicItemDetail: Story = { parameters: { route: '/catalogue/6' } }

/** As admin: Edit and Delete buttons. */
export const MusicItemDetailAsAdmin: Story = {
  parameters: { route: '/catalogue/6' },
  beforeEach() {
    actAs(admin)
  },
}

/** 404 from the backend: NotFoundState instead of an error alert. */
export const MusicItemNotFound: Story = { parameters: { route: '/catalogue/99' } }

// --- Collections ---

export const MyCollection: Story = { parameters: { route: '/collection' } }

export const MyCollectionAsBen: Story = {
  parameters: { route: '/collection' },
  beforeEach() {
    actAs(ben)
  },
}

/** The admin has nothing in the collection yet. */
export const MyCollectionEmpty: Story = {
  parameters: { route: '/collection' },
  beforeEach() {
    actAs(admin)
  },
}

export const AllCollections: Story = { parameters: { route: '/collections' } }

// --- Admin forms ---

export const NewItem: Story = {
  parameters: { route: '/catalogue/new' },
  beforeEach() {
    actAs(admin)
  },
}

/** Change something and click "Back": the page asks before discarding the changes. */
export const EditItem: Story = {
  parameters: { route: '/catalogue/6/edit' },
  beforeEach() {
    actAs(admin)
  },
}

// --- Whole app failing ---

/** Unknown URL: the catch-all route. */
export const PageNotFound: Story = { parameters: { route: '/does-not-exist' } }

/**
 * The backend is unreachable at startup: the banner explains it and offers Retry.
 * Every request fails; the banner's Retry succeeds (then reload the catalogue with its own Retry).
 */
export const BackendDownAtStartup: Story = {
  beforeEach() {
    // Every request fails until the banner's Retry asks for the users again.
    let usersRequests = 0
    mockApi(
      anyRequest(/.*/, (request) => {
        if (request.url === '/users') usersRequests++
        return usersRequests <= 1 ? networkError : undefined // undefined: the fake backend answers
      }),
    )
  },
}
