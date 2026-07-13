<template>
  <q-page class="flex flex-center">
    <div v-if="error" class="column items-center q-gutter-md">
      <div class="text-h6">Sign-in failed</div>
      <div class="text-body2">{{ error }}</div>
      <q-btn color="primary" label="Try again" to="/signin" />
    </div>
    <div v-else class="column items-center q-gutter-md">
      <q-spinner size="3em" />
      <div class="text-body2">Signing you in…</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth-store';

// The Supabase client parses the tokens out of the URL itself on page load
// (detectSessionInUrl); this page just waits for the session to appear,
// then moves on. The magic link can also arrive with an error in the hash
// (e.g. an expired link) — surface that instead of spinning forever.
const router = useRouter();
const auth = useAuthStore();
const error = ref<string | null>(null);

const hashParams = new URLSearchParams(window.location.hash.substring(1));
const hashError = hashParams.get('error_description');
if (hashError != null) {
  error.value = hashError.replace(/\+/g, ' ');
}

let timeout: ReturnType<typeof setTimeout> | null = null;

const stop = watch(
  () => auth.signedIn,
  (signedIn) => {
    if (signedIn) {
      void router.replace('/');
    }
  },
  { immediate: true },
);

onMounted(() => {
  timeout = setTimeout(() => {
    if (!auth.signedIn && error.value == null) {
      error.value =
        'The sign-in link did not produce a session. It may have expired — request a fresh one.';
    }
  }, 8000);
});

onUnmounted(() => {
  stop();
  if (timeout != null) clearTimeout(timeout);
});
</script>
