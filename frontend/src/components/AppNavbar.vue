<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

/** One entry in the main navigation. */
interface NavItem {
  to: string
  label: string
  icon: string // Bootstrap icon name, e.g. "music-note-list"
}

const navItems: NavItem[] = [
  { to: '/catalogue', label: 'Catalogue', icon: 'music-note-list' },
  { to: '/collection', label: 'My collection', icon: 'collection' },
  { to: '/collections', label: 'All collections', icon: 'people' },
]

// The current route, reactive: re-evaluated on every navigation.
const route = useRoute()

/**
 * Vue Router's own active class only covers nested routes. Our routes are flat,
 * so "Catalogue" should also be active on /catalogue/6: compare path prefixes.
 * The trailing "/" check keeps /collection from matching /collections.
 */
function isActive(item: NavItem): boolean {
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

// Reactive state: whether the menu is expanded on small screens.
// Bootstrap would toggle the "show" class with its own JavaScript; in Vue the
// template binds the class to this ref, so Vue stays in control of the DOM.
const menuOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <nav class="navbar navbar-expand-md navbar-dark bg-primary shadow-sm">
    <div class="container">
      <RouterLink class="navbar-brand fw-semibold" :to="{ name: 'catalogue' }" @click="closeMenu">
        <i class="bi bi-vinyl-fill me-2" aria-hidden="true"></i>
        <span class="brand-text">Music Collection</span>
      </RouterLink>

      <button
        class="navbar-toggler"
        type="button"
        aria-controls="main-nav"
        :aria-expanded="menuOpen"
        aria-label="Toggle navigation"
        @click="toggleMenu"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="main-nav" class="collapse navbar-collapse" :class="{ show: menuOpen }">
        <ul class="navbar-nav me-auto">
          <li v-for="item in navItems" :key="item.to" class="nav-item">
            <RouterLink
              class="nav-link"
              :class="{ active: isActive(item) }"
              :aria-current="isActive(item) ? 'page' : undefined"
              :to="item.to"
              @click="closeMenu"
            >
              <i :class="['bi', `bi-${item.icon}`, 'me-1']" aria-hidden="true"></i>
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped lang="scss">
// `scoped`: Vue adds a unique data attribute to this component's elements and
// to these selectors, so `.brand-text` cannot affect elements of other components.
// `@use` makes our shared SCSS variables available inside the component.
@use '@/styles/variables' as *;

.brand-text {
  background: $navbar-brand-gradient;
  background-clip: text;
  color: transparent;
}
</style>
