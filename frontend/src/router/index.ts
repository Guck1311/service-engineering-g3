import {createRouter, createWebHistory} from 'vue-router';
import type {Role} from '@/api/types';
import {useNotificationsStore} from '@/stores/notifications';
import {useSessionStore} from '@/stores/session';
import CatalogueView from '@/views/CatalogueView.vue';

declare module 'vue-router' {
  interface RouteMeta {
    /** Roles allowed to open the route; any user if missing. */
    roles?: Role[];
    /** Text for the browser tab. */
    title?: string;
  }
}

/** Converts the `:id` route parameter into a number prop. */
const idProp = (route: {params: Record<string, unknown>}) => ({
  id: Number(route.params.id),
});

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'catalogue',
      component: CatalogueView,
      meta: {title: 'Catalogue'},
    },
    {
      // Other views are loaded on demand (code splitting).
      path: '/items/:id(\\d+)',
      name: 'item',
      component: () => import('@/views/MusicItemDetailView.vue'),
      props: idProp,
      meta: {title: 'Music item'},
    },
    {
      path: '/collection',
      name: 'my-collection',
      component: () => import('@/views/MyCollectionView.vue'),
      meta: {title: 'My collection', roles: ['USER']},
    },
    {
      path: '/collections',
      name: 'collections',
      component: () => import('@/views/AllCollectionsView.vue'),
      meta: {title: 'All collections'},
    },
    {
      path: '/admin/items/new',
      name: 'item-create',
      component: () => import('@/views/MusicItemEditView.vue'),
      meta: {title: 'New music item', roles: ['ADMIN']},
    },
    {
      path: '/admin/items/:id(\\d+)/edit',
      name: 'item-edit',
      component: () => import('@/views/MusicItemEditView.vue'),
      props: idProp,
      meta: {title: 'Edit music item', roles: ['ADMIN']},
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: {title: 'Not found'},
    },
  ],
  scrollBehavior: () => ({top: 0}),
});

/**
 * Role check before every navigation. The backend enforces the same rules;
 * this guard only keeps users away from pages they cannot use.
 */
router.beforeEach(async to => {
  const roles = to.meta.roles;
  if (!roles) return true;

  const session = useSessionStore();
  if (session.users.length === 0) {
    await session.loadUsers();
  }
  const role = session.currentUser?.role;
  if (role && roles.includes(role)) return true;

  useNotificationsStore().push(
    'info',
    `This page needs the role ${roles.join(' or ')}. Switch user in the navbar.`,
  );
  return {name: 'catalogue'};
});

router.afterEach(to => {
  document.title = to.meta.title
    ? `${to.meta.title} · Music Collection Manager`
    : 'Music Collection Manager';
});

// A lazy-loaded view can fail to download (e.g. after a redeploy).
router.onError(error => useNotificationsStore().error(error));

export default router;
