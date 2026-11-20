<script setup lang="ts">
import { computed, ref } from 'vue'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useCollectionStore } from '@/stores/collection'
import { useSessionStore } from '@/stores/session'

const online = useOnlineStatus()
const session = useSessionStore()
const collection = useCollectionStore()

// The user list could not be loaded at startup: without it the app cannot work
// (who are we? are we admin?), so this deserves more than a toast.
const backendDown = computed(() => online.value && session.error !== null)

const retrying = ref(false)

async function retry() {
  retrying.value = true
  try {
    await session.ensureLoaded()
    if (!session.error) await collection.load()
  } finally {
    retrying.value = false
  }
}
</script>

<template>
  <div v-if="!online" class="alert alert-warning rounded-0 mb-0 py-2 text-center" role="status">
    <i class="bi bi-wifi-off me-1"></i>You are offline. Changes cannot be saved until the connection
    is back.
  </div>
  <div
    v-else-if="backendDown"
    class="alert alert-danger rounded-0 mb-0 py-2 d-flex flex-wrap justify-content-center align-items-center gap-2"
    role="alert"
  >
    <span>
      <i class="bi bi-cloud-slash me-1"></i>{{ session.error?.message }}
      <span class="text-body-secondary small"
        >(The backend on Render may need ~30 s to wake up.)</span
      >
    </span>
    <button type="button" class="btn btn-sm btn-danger" :disabled="retrying" @click="retry">
      <span v-if="retrying" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
      Retry
    </button>
  </div>
</template>
