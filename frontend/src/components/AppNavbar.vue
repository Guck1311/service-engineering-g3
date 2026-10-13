<script setup lang="ts">
/**
 * Top navigation with role-dependent links and the user switcher, which
 * stands in for a login (not part of the exercise).
 */
import {ref, watch} from 'vue';
import {useRoute} from 'vue-router';
import {useSessionStore} from '@/stores/session';

const session = useSessionStore();
const route = useRoute();

/** Mobile menu state; Vue toggles the class instead of Bootstrap's JS. */
const expanded = ref(false);
watch(
  () => route.fullPath,
  () => (expanded.value = false),
);

function onUserChange(event: Event): void {
  session.switchUser(Number((event.target as HTMLSelectElement).value));
}
</script>

<template>
  <nav class="navbar navbar-expand-md navbar-dark bg-primary shadow-sm">
    <div class="container">
      <RouterLink class="navbar-brand fw-semibold" :to="{name: 'catalogue'}">
        <i class="bi bi-vinyl-fill me-2" aria-hidden="true" />Music Collection
      </RouterLink>
      <button
        class="navbar-toggler"
        type="button"
        aria-controls="main-nav"
        :aria-expanded="expanded"
        aria-label="Toggle navigation"
        @click="expanded = !expanded"
      >
        <span class="navbar-toggler-icon" />
      </button>

      <div
        id="main-nav"
        class="collapse navbar-collapse"
        :class="{show: expanded}"
      >
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{name: 'catalogue'}">
              Catalogue
            </RouterLink>
          </li>
          <li v-if="session.isUser" class="nav-item">
            <RouterLink class="nav-link" :to="{name: 'my-collection'}">
              My collection
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{name: 'collections'}">
              All collections
            </RouterLink>
          </li>
          <li v-if="session.isAdmin" class="nav-item">
            <RouterLink class="nav-link" :to="{name: 'item-create'}">
              <i class="bi bi-plus-circle me-1" aria-hidden="true" />New item
            </RouterLink>
          </li>
        </ul>

        <div class="d-flex align-items-center gap-2">
          <label for="user-switch" class="text-white-50 small mb-0">
            <i class="bi bi-person-circle me-1" aria-hidden="true" />Acting as
          </label>
          <select
            id="user-switch"
            class="form-select form-select-sm"
            :value="session.currentUserId ?? ''"
            :disabled="session.users.length === 0"
            @change="onUserChange"
          >
            <option
              v-for="user in session.users"
              :key="user.id"
              :value="user.id"
            >
              {{ user.name }} ({{ user.role.toLowerCase() }})
            </option>
          </select>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.nav-link.router-link-exact-active {
  font-weight: 600;
  color: var(--bs-white);
}

#user-switch {
  min-width: 10rem;
}
</style>
