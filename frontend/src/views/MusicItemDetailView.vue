<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()

// The router passes the path parameter as a prop (see `props: idProp` in the
// route table). The view does not need to know how the URL looks.
const props = defineProps<{ id: number }>()

const router = useRouter()

/** Programmatic navigation: go one step back in the browser history. */
function goBack() {
  router.back()
}
</script>

<template>
  <section>
    <button type="button" class="btn btn-link px-0 mb-3" @click="goBack">
      <i class="bi bi-arrow-left me-1"></i>Back
    </button>

    <h1 class="h3">Music item #{{ props.id }}</h1>
    <p class="text-body-secondary">Metadata, comments and ratings follow in step 7.</p>

    <RouterLink
      v-if="session.isAdmin"
      :to="{ name: 'item-edit', params: { id: props.id } }"
      class="btn btn-outline-primary btn-sm"
    >
      <i class="bi bi-pencil me-1"></i>Edit
    </RouterLink>
  </section>
</template>
