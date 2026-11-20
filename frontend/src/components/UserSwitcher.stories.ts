import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { admin } from '@/stories/fixtures'
import { actAs } from '@/stories/state'
import { onNavbar } from '@/stories/decorators'
import UserSwitcher from './UserSwitcher.vue'

/** There is no login: the user picks one of the seeded users, and every request is sent as that user. */
const meta = {
  title: 'App shell/UserSwitcher',
  component: UserSwitcher,
  decorators: [onNavbar],
} satisfies Meta<typeof UserSwitcher>

export default meta
type Story = StoryObj<typeof meta>

export const AsUser: Story = {
  beforeEach() {
    actAs()
  },
}

/** The admin gets a badge (and, in the app, the edit buttons). */
export const AsAdmin: Story = {
  beforeEach() {
    actAs(admin)
  },
}

/** Before GET /users answered: disabled with a placeholder. */
export const LoadingUsers: Story = {}
