<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

// One view for two routes: /catalogue/new (no id) and /catalogue/:id/edit (with id).
const props = defineProps<{ id?: number }>()

const isEdit = computed(() => props.id !== undefined)

const router = useRouter()

/** Placeholder for saving; after saving, navigate to the detail page. */
function save() {
  const id = props.id ?? 1 // the backend returns the new id in step 7
  // `replace` instead of `push`: the form page is not kept in the history,
  // so "Back" on the detail page does not return to the form.
  router.replace({ name: 'item-detail', params: { id } })
}
</script>

<template>
  <section>
    <h1 class="h3 mb-3">{{ isEdit ? `Edit music item #${props.id}` : 'New music item' }}</h1>
    <p class="text-body-secondary">The form follows in step 7 (admin only).</p>
    <button type="button" class="btn btn-primary" @click="save">Save</button>
  </section>
</template>
