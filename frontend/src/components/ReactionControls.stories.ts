import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import type { Reaction } from '@/api/types'
import ReactionControls from './ReactionControls.vue'

/**
 * Presentational: shows `reaction` and `favourite` and only REPORTS clicks as
 * events (see the Actions panel). In the app, the collection store decides what
 * happens; here the stories write the result back into the args.
 */
const meta = {
  title: 'Music/ReactionControls',
  component: ReactionControls,
  args: {
    reaction: 'NONE',
    favourite: false,
    disabled: false,
    onReact: fn(),
    onToggleFavourite: fn(),
  },
  argTypes: {
    reaction: { control: 'inline-radio', options: ['NONE', 'LIKE', 'DISLIKE'] },
  },
  render: (args) => {
    const [, updateArgs] = useArgs()
    return {
      components: { ReactionControls },
      setup: () => ({
        args,
        react: (reaction: Reaction) =>
          // Same rule as the store: disliking removes the favourite flag.
          updateArgs(reaction === 'DISLIKE' ? { reaction, favourite: false } : { reaction }),
        toggle: () =>
          updateArgs(
            !args.favourite && args.reaction === 'DISLIKE'
              ? { favourite: true, reaction: 'NONE' }
              : { favourite: !args.favourite },
          ),
      }),
      template: '<ReactionControls v-bind="args" @react="react" @toggle-favourite="toggle" />',
    }
  },
} satisfies Meta<typeof ReactionControls>

export default meta
type Story = StoryObj<typeof meta>

export const NoReaction: Story = {}

export const Liked: Story = { args: { reaction: 'LIKE' } }

export const Disliked: Story = { args: { reaction: 'DISLIKE' } }

export const LikedAndFavourite: Story = { args: { reaction: 'LIKE', favourite: true } }

/** While a change is being saved. */
export const Disabled: Story = { args: { reaction: 'LIKE', disabled: true } }
