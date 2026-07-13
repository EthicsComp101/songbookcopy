<template>
  <q-page class="flex flex-center">
    <q-card
      v-if="auth.initialized && auth.signedIn"
      flat
      bordered
      class="profile-card q-pa-md"
    >
      <q-card-section>
        <div class="text-h6">Your profile</div>
        <div class="text-body2 q-mt-sm">Signed in as {{ auth.email }}</div>
      </q-card-section>
      <q-card-section>
        <q-form @submit.prevent="save">
          <q-input
            v-model="name"
            label="Display name"
            hint="This is the name shown next to any version of a song you add."
            :disable="saving"
            :rules="[(v) => !!v?.trim() || 'Display name cannot be empty']"
          />
          <q-btn
            class="full-width q-mt-md"
            color="primary"
            type="submit"
            label="Save"
            :loading="saving"
            :disable="name.trim() === '' || name.trim() === auth.displayName"
          />
        </q-form>
      </q-card-section>
    </q-card>
    <div
      v-else-if="auth.initialized"
      class="column items-center q-gutter-md"
    >
      <div class="text-body2">You need to sign in to edit your profile.</div>
      <q-btn color="primary" label="Sign in" to="/signin" />
    </div>
    <q-spinner v-else size="3em" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';

const $q = useQuasar();
const auth = useAuthStore();

const name = ref(auth.displayName ?? '');
const saving = ref(false);

// The profile loads asynchronously; pick it up when it arrives, but never
// clobber what the user is mid-way through typing.
watch(
  () => auth.displayName,
  (loaded) => {
    if (name.value === '' && loaded != null) name.value = loaded;
  },
);

async function save() {
  saving.value = true;
  try {
    await auth.updateDisplayName(name.value);
    $q.notify({ type: 'positive', message: 'Display name updated' });
  } catch (e) {
    $q.notify({
      type: 'negative',
      message:
        'Could not update display name: ' +
        (e instanceof Error ? e.message : String(e)),
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.profile-card {
  width: 100%;
  max-width: 400px;
}
</style>
