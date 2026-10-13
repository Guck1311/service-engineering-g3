<script setup lang="ts">
/**
 * Root component: navbar, the current route's view and the toasts.
 * Loads the users on start and leaves pages the newly selected user may
 * not see after a user switch.
 */
import {onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import ErrorAlert from '@/components/ErrorAlert.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ToastHost from '@/components/ToastHost.vue';
import {useSessionStore} from '@/stores/session';

const session = useSessionStore();
const route = useRoute();
const router = useRouter();
const startupError = ref<unknown>(null);

async function loadUsers(): Promise<void> {
  startupError.value = null;
  try {
    await session.loadUsers();
  } catch (error) {
    startupError.value = error;
  }
}

onMounted(loadUsers);

watch(
  () => session.currentUser?.role,
  role => {
    const allowed = route.meta.roles;
    if (role && allowed && !allowed.includes(role)) {
      void router.replace({name: 'catalogue'});
    }
  },
);
</script>

<template>
  <AppNavbar />
  <main class="container py-4">
    <ErrorAlert
      v-if="startupError"
      :error="startupError"
      retryable
      @retry="loadUsers"
    />
    <!-- Views need a known user, because requests send its id. -->
    <LoadingSpinner v-else-if="!session.currentUser" />
    <!-- Re-create the view when the user changes, so it loads that user's data. -->
    <RouterView v-else :key="session.currentUserId ?? undefined" />
  </main>
  <ToastHost />
</template>
