// The same global styles as the app (main.ts): Bootstrap theme and icon font.
import '../src/styles/main.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { setup, type Preview } from '@storybook/vue3-vite'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { errorHandling } from '../src/plugins/error-handling'
import { createAppRouter } from '../src/router'
import { fakeBackend } from '../src/stories/fake-backend'
import { resetMockApi } from '../src/stories/mock-api'

/**
 * Every story is its own small Vue app. Storybook calls the function passed to
 * setup() for each of them, so each story gets what main.ts gives the real app:
 * Pinia, the router (with an in-memory history instead of the address bar) and
 * our error-handling plugin, which turns uncaught errors into toasts.
 */
let pinia: Pinia

setup(async (app, context) => {
  app.use(pinia)
  const router = createAppRouter(createMemoryHistory())
  // A story can set the current route with `parameters: { route: '/catalogue/6' }`.
  await router.push((context?.parameters.route as string | undefined) ?? '/catalogue')
  app.use(router)
  app.use(errorHandling, { router })
})

const preview: Preview = {
  // Runs before every story, before the story's own beforeEach.
  beforeEach({ globals }) {
    // Fresh stores: nothing a previous story changed is left over.
    pinia = createPinia()
    setActivePinia(pinia)
    try {
      // The session store remembers the user in localStorage: start as Anna every time.
      localStorage.removeItem('music-collection.userId')
      // The theme store reads its preference from there: follow the toolbar switch.
      localStorage.setItem('music-collection.theme', globals.theme === 'dark' ? 'dark' : 'light')
    } catch {
      // storage blocked: the defaults apply anyway
    }
    // A fresh fake backend with the seed data; a story's own mockApi() routes take precedence.
    resetMockApi(...fakeBackend())
  },

  decorators: [
    // Light/dark switch in the toolbar: the same attribute the theme store sets in the app.
    (story, { globals }) => {
      document.documentElement.setAttribute(
        'data-bs-theme',
        globals.theme === 'dark' ? 'dark' : 'light',
      )
      return { components: { story }, template: '<story />' }
    },
  ],

  globalTypes: {
    theme: {
      description: 'Color mode',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },

  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Error handling',
          'Errors',
          'Basics',
          'Music',
          'App shell',
          'Pages',
        ],
      },
    },
  },

  // A generated docs page (props, events, slots, all stories) for every component.
  tags: ['autodocs'],
}

export default preview
