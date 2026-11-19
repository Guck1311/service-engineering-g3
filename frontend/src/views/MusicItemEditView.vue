<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { ApiError } from '@/api/api-error'
import type { CreateMusicItem } from '@/api/types'
import ErrorAlert from '@/components/ErrorAlert.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import MusicItemForm from '@/components/MusicItemForm.vue'
import { useAsync } from '@/composables/useAsync'
import { musicItemsService } from '@/services/music-items.service'

// One view for two routes: /catalogue/new (no id) and /catalogue/:id/edit (with id).
const props = defineProps<{ id?: number }>()

const router = useRouter()
const isEdit = computed(() => props.id !== undefined)

// Editing: load the existing item first.
const { data: item, loading, error: loadError, run: load } = useAsync(musicItemsService.get)
watch(
  () => props.id,
  (id) => {
    if (id !== undefined) void load(id)
  },
  { immediate: true },
)

// Template ref: access to the child component instance (its defineExpose members).
const formRef = useTemplateRef<InstanceType<typeof MusicItemForm>>('form')

const saving = ref(false)
const saveError = shallowRef<ApiError | null>(null)

async function save(payload: CreateMusicItem) {
  saving.value = true
  saveError.value = null
  try {
    const saved =
      props.id !== undefined
        ? await musicItemsService.update(props.id, payload)
        : await musicItemsService.create(payload)
    formRef.value?.markSaved()
    // replace: Back on the detail page should not return to the form.
    await router.replace({ name: 'item-detail', params: { id: saved.id } })
  } catch (e) {
    // Form errors are shown right here, next to the form (with the backend's details).
    saveError.value = ApiError.from(e)
  } finally {
    saving.value = false
  }
}

function cancel() {
  router.back()
}

// In-component navigation guard: warn before leaving with unsaved changes.
onBeforeRouteLeave(() => {
  if (formRef.value?.isDirty && !confirm('Discard your unsaved changes?')) return false
})
</script>

<template>
  <section style="max-width: 52rem">
    <h1 class="h3 mb-4">
      <i
        :class="['bi', isEdit ? 'bi-pencil-square' : 'bi-plus-square', 'text-primary', 'me-2']"
      ></i>
      {{ isEdit ? 'Edit music item' : 'New music item' }}
    </h1>

    <ErrorAlert v-if="loadError" :error="loadError" retryable @retry="load(id!)" />
    <LoadingSpinner v-else-if="isEdit && loading" />
    <div v-else-if="!isEdit || item" class="card">
      <div class="card-body">
        <ErrorAlert v-if="saveError" :error="saveError" />
        <MusicItemForm
          ref="form"
          :initial="item"
          :submitting="saving"
          @submit="save"
          @cancel="cancel"
        />
      </div>
    </div>
  </section>
</template>
