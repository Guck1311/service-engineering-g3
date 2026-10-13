<script setup lang="ts">
/**
 * Adds an item to the current user's collection or removes it again.
 * Reads and changes the shared collection store, so every view that shows
 * the same item updates at once.
 */
import {computed, ref} from 'vue';
import {useCollectionStore} from '@/stores/collection';
import {useNotificationsStore} from '@/stores/notifications';

const props = defineProps<{musicItemId: number; title: string}>();

const collection = useCollectionStore();
const notifications = useNotificationsStore();
const busy = ref(false);

const inCollection = computed(
  () => collection.entryFor(props.musicItemId) !== undefined,
);

async function toggle(): Promise<void> {
  busy.value = true;
  try {
    if (inCollection.value) {
      await collection.remove(props.musicItemId);
      notifications.success(`Removed "${props.title}" from your collection`);
    } else {
      await collection.add(props.musicItemId);
      notifications.success(`Added "${props.title}" to your collection`);
    }
  } catch (error) {
    notifications.error(error);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <button
    type="button"
    class="btn btn-sm"
    :class="inCollection ? 'btn-outline-secondary' : 'btn-primary'"
    :disabled="busy"
    @click="toggle"
  >
    <span
      v-if="busy"
      class="spinner-border spinner-border-sm me-1"
      aria-hidden="true"
    />
    <i
      v-else
      class="bi me-1"
      :class="inCollection ? 'bi-check2' : 'bi-plus-lg'"
      aria-hidden="true"
    />
    {{ inCollection ? 'In your collection' : 'Add to collection' }}
  </button>
</template>
