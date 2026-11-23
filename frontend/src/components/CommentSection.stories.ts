import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Comment } from '@/api/types'
import { abbeyRoad, anna, ben, getLucky, page } from '@/stories/fixtures'
import { failWith, get, mockApi, networkError, ok, pending, post } from '@/stories/mock-api'
import { actAs } from '@/stories/state'
import { withToasts } from '@/stories/decorators'
import CommentSection from './CommentSection.vue'

/** Comments of one item, newest first, with "Load more" and a form for a new comment. */
const meta = {
  title: 'Music/CommentSection',
  component: CommentSection,
  args: { musicItemId: abbeyRoad.id },
  decorators: [
    withToasts,
    (story) => ({
      components: { story },
      template: '<div style="max-width: 40rem"><story /></div>',
    }),
  ],
  beforeEach() {
    actAs()
  },
} satisfies Meta<typeof CommentSection>

export default meta
type Story = StoryObj<typeof meta>

/** Write a comment and post it: it appears at the top. */
export const WithComments: Story = {}

export const NoComments: Story = { args: { musicItemId: getLucky.id } }

/** 25 comments, 10 per page: "Load more" fetches the next page and appends it. */
export const ManyComments: Story = {
  beforeEach() {
    const all: Comment[] = Array.from({ length: 25 }, (_, i) => ({
      id: 100 + i,
      musicItemId: abbeyRoad.id,
      user: i % 2 ? ben : anna,
      text: `Comment number ${25 - i}`,
      createdAt: new Date(Date.UTC(2026, 10, 19, 12, 25 - i)).toISOString(),
    }))
    mockApi(
      get(/^\/music-items\/\d+\/comments$/, ({ params }) => {
        const p = Number(params.page ?? 1)
        const limit = Number(params.limit ?? 10)
        return ok(page(all.slice((p - 1) * limit, p * limit), all.length, p, limit))
      }),
    )
  },
}

export const Loading: Story = {
  beforeEach() {
    mockApi(get(/^\/music-items\/\d+\/comments$/, pending))
  },
}

/** Loading fails: ErrorAlert with "Retry" inside the section, the form still works. */
export const LoadFails: Story = {
  beforeEach() {
    mockApi(get(/^\/music-items\/\d+\/comments$/, networkError))
  },
}

/** The backend rejects the comment (400): the toast lists the validation messages. */
export const PostRejected: Story = {
  beforeEach() {
    mockApi(
      post(
        /^\/music-items\/\d+\/comments$/,
        failWith(400, ['text must be shorter than or equal to 2000 characters']),
      ),
    )
  },
}
