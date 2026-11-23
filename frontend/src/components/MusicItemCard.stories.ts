import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  abbeyRoad,
  annasCollection,
  bohemianRhapsody,
  getLucky,
  roadTrip,
} from '@/stories/fixtures'
import { actAs, withCollection } from '@/stories/state'
import { withToasts } from '@/stories/decorators'
import CollectionButton from './CollectionButton.vue'
import MusicItemCard from './MusicItemCard.vue'

const meta = {
  title: 'Music/MusicItemCard',
  component: MusicItemCard,
  args: { item: getLucky },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="max-width: 22rem"><story /></div>',
    }),
  ],
} satisfies Meta<typeof MusicItemCard>

export default meta
type Story = StoryObj<typeof meta>

export const Track: Story = {}

/** Rated items show the average as stars. */
export const RatedAlbum: Story = { args: { item: abbeyRoad } }

/** A playlist has no artist: the card says "Various artists". */
export const Playlist: Story = { args: { item: roadTrip } }

/**
 * The `#actions` scoped slot: the catalogue puts the CollectionButton there.
 * The button talks to the collection store and the (fake) backend.
 */
export const WithActionsSlot: Story = {
  args: { item: bohemianRhapsody },
  decorators: [withToasts],
  beforeEach() {
    actAs()
    withCollection(annasCollection)
  },
  render: (args) => ({
    components: { MusicItemCard, CollectionButton },
    setup: () => ({ args }),
    template: `
      <MusicItemCard v-bind="args">
        <template #actions="{ item }">
          <CollectionButton :music-item-id="item.id" />
        </template>
      </MusicItemCard>`,
  }),
}
