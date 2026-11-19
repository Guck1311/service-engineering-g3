<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCollectionStore } from '@/stores/collection'

/**
 * Container component: unlike ReactionControls, it talks to the store itself.
 * Every instance (catalogue card, detail page) shows the same, shared state.
 */
const props = defineProps<{ musicItemId: number }>()

const collection = useCollectionStore()
const inCollection = computed(() => collection.has(props.musicItemId))
const busy = ref(false)

// Errors are not caught here: Vue passes errors of event handlers to the
// app-wide error handler, which shows them (step 8).
async function toggle() {
  busy.value = true
  try {
    if (inCollection.value) await collection.remove(props.musicItemId)
    else await collection.add(props.musicItemId)
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
