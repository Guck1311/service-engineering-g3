<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCollectionStore } from '@/stores/collection'
import { useNotificationsStore } from '@/stores/notifications'

/**
 * Container component: unlike ReactionControls, it talks to the store itself.
 * Every instance (catalogue card, detail page) shows the same, shared state.
 */
const props = defineProps<{ musicItemId: number }>()

const collection = useCollectionStore()
const notifications = useNotificationsStore()
const inCollection = computed(() => collection.has(props.musicItemId))
const busy = ref(false)

// No catch: if the store throws (e.g. 409, offline), Vue passes the rejected
// promise of this event handler to app.config.errorHandler, which shows a toast.
// `finally` still resets the button.
async function toggle() {
  busy.value = true
  try {
    if (inCollection.value) {
      const title = collection.entryFor(props.musicItemId)?.musicItem.title
      await collection.remove(props.musicItemId)
      notifications.success(`Removed "${title}" from your collection.`)
    } else {
      const entry = await collection.add(props.musicItemId)
      notifications.success(`Added "${entry.musicItem.title}" to your collection.`)
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <button
    type="button"
    :class="['btn btn-sm', inCollection ? 'btn-outline-primary' : 'btn-primary']"
    :disabled="busy || !collection.loaded"
    @click="toggle"
  >
    <span v-if="busy" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
    <template v-else-if="inCollection">
      <i class="bi bi-check2 me-1" aria-hidden="true"></i>In collection · remove
    </template>
    <template v-else
      ><i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Add to collection</template
    >
  </button>
</template>
