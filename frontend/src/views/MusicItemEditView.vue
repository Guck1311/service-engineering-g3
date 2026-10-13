<script setup lang="ts">
/**
 * Admin page to create a music item (`/admin/items/new`) or edit one
 * (`/admin/items/:id/edit`). Validation errors from the backend are shown
 * above the form.
 */
import {onMounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import type {MusicItemInput} from '@/api/types';
import ErrorAlert from '@/components/ErrorAlert.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import MusicItemForm from '@/components/MusicItemForm.vue';
import {useAsync} from '@/composables/useAsync';
import {musicItemsService} from '@/services/music-items.service';
import {useNotificationsStore} from '@/stores/notifications';

const props = defineProps<{
  /** Id of the item to edit; missing when creating. */
  id?: number;
}>();

const router = useRouter();
const notifications = useNotificationsStore();
const {
  data: item,
  loading,
  error: loadError,
  run: load,
} = useAsync(musicItemsService.get);
const saving = ref(false);
const saveError = ref<unknown>(null);

onMounted(() => {
  if (props.id !== undefined) void load(props.id);
});

async function save(input: MusicItemInput): Promise<void> {
  saving.value = true;
  saveError.value = null;
  try {
    const saved =
      props.id === undefined
        ? await musicItemsService.create(input)
        : await musicItemsService.replace(props.id, input);
    notifications.success(`Saved "${saved.title}"`);
    await router.push({name: 'item', params: {id: saved.id}});
  } catch (e) {
    saveError.value = e;
    window.scrollTo({top: 0, behavior: 'smooth'});
  } finally {
    saving.value = false;
  }
}

function cancel(): void {
  if (props.id === undefined) void router.push({name: 'catalogue'});
  else void router.push({name: 'item', params: {id: props.id}});
}
</script>

<template>
  <div class="mx-auto edit-page">
    <h1 class="h2 mb-4">
      {{ id === undefined ? 'New music item' : `Edit ${item?.title ?? ''}` }}
    </h1>

    <ErrorAlert v-if="saveError" :error="saveError" />

    <template v-if="id === undefined">
      <MusicItemForm :submitting="saving" @submit="save" @cancel="cancel" />
    </template>
    <ErrorAlert
      v-else-if="loadError"
      :error="loadError"
      retryable
      @retry="load(id)"
    />
    <LoadingSpinner v-else-if="loading || !item" />
    <!-- Keyed by id, so the form is rebuilt when another item is opened. -->
    <MusicItemForm
      v-else
      :key="item.id"
      :initial="item"
      :submitting="saving"
      @submit="save"
      @cancel="cancel"
    />
  </div>
</template>

<style scoped lang="scss">
.edit-page {
  max-width: 48rem;
}
</style>
