<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import ConnectionBanner from '@/components/ConnectionBanner.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import ToastHost from '@/components/ToastHost.vue'
import { useCollectionStore } from '@/stores/collection'
import { useSessionStore } from '@/stores/session'
import { useThemeStore } from '@/stores/theme'

// Created here so the color mode is applied from the first render on.
useThemeStore()

const session = useSessionStore()
const collection = useCollectionStore()

// Lifecycle hook: runs once after the app shell is in the DOM.
// Users first (needed to know who we are), then that user's collection.
// If the backend is unreachable, the ConnectionBanner shows the error with Retry.
onMounted(async () => {
  await session.ensureLoaded()
  if (!session.error) await collection.load()
})
</script>

<template>
  <!-- App shell: stays the same on every page; only <RouterView> changes. -->
  <div class="d-flex flex-column min-vh-100">
    <AppNavbar />
    <ConnectionBanner />

    <main class="container flex-grow-1 py-4">
      <!-- A crashing page shows a fallback instead of a blank area. -->
      <ErrorBoundary>
        <RouterView />
      </ErrorBoundary>
    </main>

    <footer class="py-3 text-center text-body-secondary small border-top">
      Music Collection Manager · Service Engineering WS 2026/27 · Group 3
    </footer>

    <ToastHost />
  </div>
</template>
