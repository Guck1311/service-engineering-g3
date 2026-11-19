import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

// Only the start page for now; the full route table follows in step 3.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
  ],
})

export default router
