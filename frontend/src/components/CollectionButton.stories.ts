import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { annasCollection, bohemianRhapsody, entry, getLucky } from '@/stories/fixtures'
import { failWith, mockApi, networkError, ok, post } from '@/stories/mock-api'
import { actAs, withCollection } from '@/stories/state'
import { withToasts } from '@/stories/decorators'
import { useCollectionStore } from '@/stores/collection'
import CollectionButton from './CollectionButton.vue'

/**
 * A container component: it uses the collection store, which calls the backend.
 * It has no try/catch: a failed request reaches app.config.errorHandler, which
 * shows a toast. The stories below make the fake backend fail in different ways.
 *
 * Anna's collection holds Abbey Road and Get Lucky (as in the seed data);
 * Bohemian Rhapsody is not in it yet.
 */
const meta = {
  title: 'Music/CollectionButton',
  component: CollectionButton,
  args: { musicItemId: bohemianRhapsody.id },
  decorators: [withToasts],
  beforeEach() {
    actAs()
    withCollection(annasCollection)
  },
} satisfies Meta<typeof CollectionButton>

export default meta
type Story = StoryObj<typeof meta>

/** Click: the item is added and a success toast appears. */
export const NotInCollection: Story = {}

/** Click: the item is removed again. */
export const InCollection: Story = { args: { musicItemId: getLucky.id } }

/** Disabled until the collection has been loaded. */
export const CollectionNotLoadedYet: Story = {
  beforeEach() {
    // As right after the app started, before GET /users/{id}/collection answered.
    useCollectionStore().loaded = false
  },
}

/** Slow backend: the button shows a spinner while the request runs. */
export const SlowRequest: Story = {
  beforeEach() {
    mockApi(post(/^\/users\/\d+\/collection$/, ok(entry(bohemianRhapsody), 3000)))
  },
}

/** 409 Conflict (e.g. added in another tab meanwhile): the error becomes a toast. */
export const AlreadyInCollection: Story = {
  beforeEach() {
    mockApi(
      post(
        /^\/users\/\d+\/collection$/,
        failWith(409, `Music item ${bohemianRhapsody.id} is already in the collection`),
      ),
    )
  },
}

/** No connection: a network error becomes a toast. */
export const BackendUnreachable: Story = {
  beforeEach() {
    mockApi(post(/^\/users\/\d+\/collection$/, networkError))
  },
}
