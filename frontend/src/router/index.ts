import { createRouter, createWebHistory, type RouteRecordRaw, type RouterHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import CatalogueView from '@/views/CatalogueView.vue'

// Typed route meta fields: TypeScript now knows `to.meta.title` and `to.meta.requiresAdmin`.
declare module 'vue-router' {
  interface RouteMeta {
    /** Shown in the browser tab. */
    title?: string
    /** Only the admin may open this page (checked by a guard in step 6). */
    requiresAdmin?: boolean
  }
}

/** Converts the `:id` path parameter into a number prop. */
function idProp(route: { params: Record<string, string | string[]> }) {
  return { id: Number(route.params.id) }
}

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { name: 'catalogue' } },
  {
    path: '/catalogue',
    name: 'catalogue',
    // Imported statically: the start page is part of the main bundle.
    component: CatalogueView,
    meta: { title: 'Catalogue' },
  },
  {
    path: '/catalogue/new',
    name: 'item-create',
    // Lazy loading: `import()` creates a separate chunk that is only
    // downloaded when the route is visited for the first time.
    component: () => import('@/views/MusicItemEditView.vue'),
    meta: { title: 'New music item', requiresAdmin: true },
  },
  {
    // `(\d+)` restricts the parameter to digits, so `/catalogue/abc` is a 404
    // and `/catalogue/new` can never be mistaken for an id.
    path: '/catalogue/:id(\\d+)',
    name: 'item-detail',
    component: () => import('@/views/MusicItemDetailView.vue'),
    props: idProp, // the view receives `id: number` as a prop instead of reading the route
    meta: { title: 'Music item' },
  },
  {
    path: '/catalogue/:id(\\d+)/edit',
    name: 'item-edit',
    component: () => import('@/views/MusicItemEditView.vue'),
    props: idProp,
    meta: { title: 'Edit music item', requiresAdmin: true },
  },
  {
    path: '/collection',
    name: 'my-collection',
    component: () => import('@/views/MyCollectionView.vue'),
    meta: { title: 'My collection' },
  },
  {
    // Optional filter as query parameter: /collections?userId=2
    path: '/collections',
    name: 'all-collections',
    component: () => import('@/views/AllCollectionsView.vue'),
    props: (route) => ({
      userId: route.query.userId ? Number(route.query.userId) : undefined,
    }),
    meta: { title: 'All collections' },
  },
  {
    // Catch-all: every path not matched above.
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page not found' },
  },
]

/**
 * Creates the router with all routes and guards. A factory, so that tests can
 * create the same router with an in-memory history.
 */
export function createAppRouter(history: RouterHistory) {
  const router = createRouter({
    history,
    routes,
    // Back/forward restores the old scroll position; new pages start at the top.
    scrollBehavior(_to, _from, savedPosition) {
      return savedPosition ?? { top: 0 }
    },
  })

  // Global before-guard: runs before every navigation and may cancel or redirect it.
  router.beforeEach(async (to) => {
    if (!to.meta.requiresAdmin) return true
    // The store is used inside the guard (not at module level): by then Pinia is installed.
    const session = useSessionStore()
    await session.ensureLoaded() // on a direct page load the user list may not be there yet
    if (session.isAdmin) return true
    return { name: 'catalogue', query: { denied: to.fullPath } } // redirect
  })

  // Global after-hook: runs after every successful navigation.
  router.afterEach((to) => {
    document.title = to.meta.title
      ? `${to.meta.title} · Music Collection Manager`
      : 'Music Collection Manager'
  })

  return router
}

// HTML5 history mode: real paths like /catalogue/3 instead of /#/catalogue/3.
export default createAppRouter(createWebHistory(import.meta.env.BASE_URL))
