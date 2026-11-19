<script setup lang="ts">
import { onErrorCaptured, ref, shallowRef, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ApiError } from '@/api/api-error'

/**
 * Error boundary around the page content. If a component below crashes while
 * rendering or setting up (a bug), the page would otherwise stay blank or half
 * drawn. Instead, this shows a fallback with "Try again".
 */
const crash = shallowRef<unknown>(null)
const renderKey = ref(0)

// onErrorCaptured: called for errors in ANY descendant component.
onErrorCaptured((error, _instance, info) => {
  // Failed API calls are expected (no network, 403, ...): they are not a crash.
  // Returning true lets them continue to the global handler, which shows a toast.
  if (error instanceof ApiError) return true

  console.error(`[ErrorBoundary] ${info}`, error)
  crash.value = error
  return false // stop propagation: handled here
})

// Navigating elsewhere gives the new page a fresh chance.
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    crash.value = null
  },
)

/** Re-creates the children: a changed key makes Vue unmount and mount them anew. */
function retry() {
  crash.value = null
  renderKey.value++
}
</script>

<template>
  <!-- Explicit, distinct keys: v-if/v-else branches get the automatic keys 0 and 1.
       A plain :key="renderKey" (also 0 at first) made Vue treat the fallback and the
       content as the SAME <div> and patch one into the other, which broke the fallback. -->
  <div v-if="crash" key="crash" class="text-center py-5" role="alert">
    <i class="bi bi-bug display-4 text-danger"></i>
    <h1 class="h4 mt-3">This page ran into a problem</h1>
    <p class="text-body-secondary">
      Something went wrong while showing this page. Trying again usually helps.
    </p>
    <div class="d-flex justify-content-center gap-2">
      <button type="button" class="btn btn-primary" @click="retry">
        <i class="bi bi-arrow-clockwise me-1"></i>Try again
      </button>
      <RouterLink :to="{ name: 'catalogue' }" class="btn btn-outline-secondary">
        Go to the catalogue
      </RouterLink>
    </div>
  </div>
  <div v-else :key="`content-${renderKey}`">
    <slot />
  </div>
</template>
