<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import { useCollectionStore } from '@/stores/collection'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const collection = useCollectionStore()

// Lifecycle hook: runs once after the app shell is in the DOM.
// Users first (needed to know who we are), then that user's collection.
onMounted(async () => {
  await session.ensureLoaded()
  await collection.load()
})
</script>

<template>
  <!-- App shell: stays the same on every page; only <RouterView> changes. -->
  <div class="d-flex flex-column min-vh-100">
    <AppNavbar />

    <main class="container flex-grow-1 py-4">
      <RouterView />
    </main>

    <footer class="py-3 text-center text-body-secondary small border-top">
      Music Collection Manager · Service Engineering WS 2026/27 · Group 3
    </footer>
  </div>
</template>
