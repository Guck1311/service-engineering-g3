import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { admin, annasCollection } from '@/stories/fixtures'
import { actAs, withCollection } from '@/stories/state'
import AppNavbar from './AppNavbar.vue'

/**
 * The badge next to "My collection" is a computed value of the collection store:
 * it follows every change, wherever in the app it happens.
 */
const meta = {
  title: 'App shell/AppNavbar',
  component: AppNavbar,
  parameters: { layout: 'fullscreen' },
  beforeEach() {
    actAs()
    withCollection(annasCollection)
  },
} satisfies Meta<typeof AppNavbar>

export default meta
type Story = StoryObj<typeof meta>

/** Anna on the catalogue, two items in her collection. */
export const OnCatalogue: Story = {}

/** "Catalogue" stays active on sub-pages such as /catalogue/6. */
export const OnDetailPage: Story = { parameters: { route: '/catalogue/6' } }

export const OnMyCollection: Story = { parameters: { route: '/collection' } }

export const AsAdmin: Story = {
  beforeEach() {
    actAs(admin)
    withCollection()
  },
}

/** Narrow screens: the menu collapses behind the toggler button. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
}
