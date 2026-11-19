<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

// `?userId=2` arrives as a prop (see the route table); undefined = all users.
const props = defineProps<{ userId?: number }>()

const router = useRouter()

// The user list is already loaded by the session store; no second request needed.
const session = useSessionStore()
const users = computed(() => session.users)
const selectedUser = computed(() => users.value.find((u) => u.id === props.userId))

/**
 * Writes the filter into the URL instead of keeping it only in component state:
 * the filtered page can be bookmarked, shared and restored with Back.
 */
function onFilterChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  router.replace({ query: value ? { userId: value } : {} })
}
</script>

<template>
  <section>
    <h1 class="h3 mb-3"><i class="bi bi-people text-primary me-2"></i>All collections</h1>

    <label class="form-label" for="user-filter">Show collection of</label>
    <select
      id="user-filter"
      class="form-select mb-3"
      style="max-width: 16rem"
      :value="props.userId ?? ''"
      @change="onFilterChange"
    >
      <option value="">All users</option>
      <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
    </select>

    <p class="text-body-secondary">
      Showing: <strong>{{ selectedUser?.name ?? 'all users' }}</strong
      >. The list follows in step 7.
    </p>
  </section>
</template>
