<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()

// storeToRefs: destructuring a store directly would lose reactivity;
// storeToRefs turns its state and getters into refs that stay connected.
const { users, currentUserId, isAdmin } = storeToRefs(session)

function onChange(event: Event) {
  // Actions are called on the store itself (they are plain functions).
  session.switchUser(Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <div class="d-flex align-items-center gap-2">
    <label for="user-switcher" class="text-white-50 small mb-0">
      <i class="bi bi-person-circle" aria-hidden="true"></i>
      <span class="visually-hidden">Act as user</span>
    </label>
    <select
      id="user-switcher"
      class="form-select form-select-sm"
      :value="currentUserId"
      :disabled="users.length === 0"
      @change="onChange"
    >
      <option v-if="users.length === 0" :value="currentUserId">Loading users…</option>
      <option v-for="user in users" :key="user.id" :value="user.id">
        {{ user.name }}{{ user.role === 'ADMIN' ? ' (admin)' : '' }}
      </option>
    </select>
    <span v-if="isAdmin" class="badge text-bg-warning" title="Can edit the catalogue">ADMIN</span>
  </div>
</template>
