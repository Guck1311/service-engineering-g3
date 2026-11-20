import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ApiError } from '@/api/api-error'
import { collectionsService } from '@/services/collections.service'
import { commentsService } from '@/services/comments.service'
import { musicItemsService } from '@/services/music-items.service'
import { withToasts } from './decorators'
import { actAs } from './state'

/**
 * One button per source of errors in the app. Each one goes the real way:
 * a real request to the fake backend, a real event handler, a real lazy route.
 * Watch where each error ends up: a toast, the console, or nowhere on purpose.
 */
const ErrorSources = defineComponent({
  components: { RouterLink },
  setup() {
    // A lazy route whose chunk cannot be downloaded, as after a new deployment.
    useRouter().addRoute({
      path: '/old-chunk',
      name: 'old-chunk',
      component: () =>
        Promise.reject(
          new TypeError(
            'Failed to fetch dynamically imported module: /assets/MusicItemDetailView-3f2a.js',
          ),
        ),
    })

    return {
      // Event handlers WITHOUT try/catch, like CollectionButton in the app.
      // Vue catches the rejected promise and passes it to app.config.errorHandler.
      addDuplicate: () => collectionsService.add(2, 6), // Anna already has Abbey Road: 409
      emptyComment: () => commentsService.create(6, ' '), // 400 with validation details
      unknownItem: () => musicItemsService.get(99), // 404
      notAdmin: () => musicItemsService.remove(6), // Anna is not admin: 403
      bugInHandler: () => {
        const item = undefined as unknown as { title: string }
        return item.title // TypeError: a bug, not an API error
      },
      canceled: () => {
        throw new ApiError('The request was canceled.', 'canceled')
      },
      // A promise nobody awaits: outside Vue, caught by the 'unhandledrejection' listener.
      floatingPromise: () => {
        void Promise.reject(
          new ApiError('The server took too long to respond. Please try again.', 'timeout'),
        )
      },
    }
  },
  template: `
    <table class="table align-middle">
      <thead>
        <tr>
          <th>Source</th><th>Caught by</th><th>The user sees</th>
          <th><span class="visually-hidden">Try it</span></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>409 from the backend in a click handler</td>
          <td><code>app.config.errorHandler</code></td>
          <td>error toast with the backend's message</td>
          <td><button class="btn btn-sm btn-outline-danger" @click="addDuplicate">Add a duplicate</button></td>
        </tr>
        <tr>
          <td>400 validation error</td>
          <td><code>app.config.errorHandler</code></td>
          <td>error toast listing each message</td>
          <td><button class="btn btn-sm btn-outline-danger" @click="emptyComment">Post an empty comment</button></td>
        </tr>
        <tr>
          <td>403 missing permission</td>
          <td><code>app.config.errorHandler</code></td>
          <td>error toast "Requires role ADMIN"</td>
          <td><button class="btn btn-sm btn-outline-danger" @click="notAdmin">Delete as Anna</button></td>
        </tr>
        <tr>
          <td>404 in an action</td>
          <td><code>app.config.errorHandler</code></td>
          <td>error toast (pages show NotFoundState instead)</td>
          <td><button class="btn btn-sm btn-outline-danger" @click="unknownItem">Load item 99</button></td>
        </tr>
        <tr>
          <td>Bug (TypeError) in a click handler</td>
          <td><code>app.config.errorHandler</code></td>
          <td>neutral toast; details in the console</td>
          <td><button class="btn btn-sm btn-outline-danger" @click="bugInHandler">Trigger a bug</button></td>
        </tr>
        <tr>
          <td>Promise that nobody awaits</td>
          <td><code>unhandledrejection</code> listener</td>
          <td>error toast</td>
          <td><button class="btn btn-sm btn-outline-danger" @click="floatingPromise">Reject a promise</button></td>
        </tr>
        <tr>
          <td>Lazy page whose chunk is gone after a deploy</td>
          <td><code>router.onError</code></td>
          <td>warning toast "please reload"</td>
          <td><RouterLink class="btn btn-sm btn-outline-danger" :to="{ name: 'old-chunk' }">Open the page</RouterLink></td>
        </tr>
        <tr>
          <td>Request canceled on purpose</td>
          <td><code>app.config.errorHandler</code></td>
          <td>nothing: not an error for the user</td>
          <td><button class="btn btn-sm btn-outline-secondary" @click="canceled">Cancel a request</button></td>
        </tr>
      </tbody>
    </table>
    <p class="small text-body-secondary mb-0">
      Errors while rendering a page are caught earlier, by the ErrorBoundary (see Errors / ErrorBoundary).
      Failed loads inside a page show an ErrorAlert with Retry (see Errors / ErrorAlert).
    </p>`,
})

const meta = {
  title: 'Error handling/Error sources',
  component: ErrorSources,
  decorators: [withToasts],
  parameters: { layout: 'padded' },
  beforeEach() {
    actAs() // the requests are sent as Anna (X-User-Id: 2)
  },
} satisfies Meta<typeof ErrorSources>

export default meta
type Story = StoryObj<typeof meta>

export const TryEachSource: Story = {}
