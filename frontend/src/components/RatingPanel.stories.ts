import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import { abbeyRoad, admin, getLucky } from '@/stories/fixtures'
import { failWith, get, mockApi, ok, pending, put } from '@/stories/mock-api'
import { actAs } from '@/stories/state'
import { withToasts } from '@/stories/decorators'
import RatingPanel from './RatingPanel.vue'

/**
 * Loads GET /music-items/{id}/ratings itself (with useAsync) and saves the
 * user's own rating with PUT. Click a star under "Your rating" to rate.
 */
const meta = {
  title: 'Music/RatingPanel',
  component: RatingPanel,
  args: { musicItemId: abbeyRoad.id, onRated: fn() },
  decorators: [
    withToasts,
    (story) => ({
      components: { story },
      template: '<div style="max-width: 28rem"><story /></div>',
    }),
  ],
  beforeEach() {
    actAs()
  },
} satisfies Meta<typeof RatingPanel>

export default meta
type Story = StoryObj<typeof meta>

/** Anna already rated Abbey Road with 5 stars. */
export const RatedByMe: Story = {}

/** Admin has not rated it yet. */
export const NotRatedByMe: Story = {
  beforeEach() {
    actAs(admin)
  },
}

/** Nobody rated this item yet. */
export const NoRatings: Story = { args: { musicItemId: getLucky.id } }

export const Loading: Story = {
  beforeEach() {
    mockApi(get(/^\/music-items\/\d+\/ratings$/, pending))
  },
}

/**
 * Loading fails with 500: the panel shows an ErrorAlert with "Retry".
 * The fake backend recovers, so the retry succeeds.
 */
export const LoadFailsThenRetry: Story = {
  beforeEach() {
    let calls = 0
    mockApi(
      get(/^\/music-items\/\d+\/ratings$/, () =>
        ++calls === 1
          ? failWith(500, 'Internal server error')
          : ok({ average: 4.5, count: 2, ratings: [] }),
      ),
    )
  },
}

/** Saving fails (403): the panel stays as it was, the error appears as a toast. */
export const SaveFails: Story = {
  beforeEach() {
    mockApi(
      put(/^\/music-items\/\d+\/ratings\/\d+$/, failWith(403, 'You can only modify your own data')),
    )
  },
}
