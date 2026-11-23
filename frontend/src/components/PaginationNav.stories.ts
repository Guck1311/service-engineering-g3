import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import PaginationNav from './PaginationNav.vue'

/** Named v-model: `<PaginationNav v-model:page="page" :total :limit />`. */
const meta = {
  title: 'Basics/PaginationNav',
  component: PaginationNav,
  args: { page: 1, total: 40, limit: 12, 'onUpdate:page': fn() },
  render: (args) => {
    const [, updateArgs] = useArgs()
    return {
      components: { PaginationNav },
      setup: () => ({ args, update: (page: number) => updateArgs({ page }) }),
      template: '<PaginationNav v-bind="args" @update:page="update" />',
    }
  },
} satisfies Meta<typeof PaginationNav>

export default meta
type Story = StoryObj<typeof meta>

export const FirstPage: Story = {}

export const MiddlePage: Story = { args: { page: 2 } }

export const LastPage: Story = { args: { page: 4 } }

/** Everything fits on one page: the component renders nothing. */
export const SinglePage: Story = { args: { total: 7 } }
