import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MusicTypeBadge from './MusicTypeBadge.vue'

const meta = {
  title: 'Basics/MusicTypeBadge',
  component: MusicTypeBadge,
  args: { type: 'TRACK' },
  argTypes: {
    type: { control: 'inline-radio', options: ['TRACK', 'ALBUM', 'PLAYLIST'] },
  },
} satisfies Meta<typeof MusicTypeBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Track: Story = {}

export const Album: Story = { args: { type: 'ALBUM' } }

export const Playlist: Story = { args: { type: 'PLAYLIST' } }
