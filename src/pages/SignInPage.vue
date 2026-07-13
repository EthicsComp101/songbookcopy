<template>
  <q-page class="flex flex-center">
    <q-card flat bordered class="signin-card q-pa-md">
      <template v-if="!sent">
        <q-card-section>
          <div class="text-h6">Sign in</div>
          <div class="text-body2 q-mt-sm">
            No password needed — enter your email and we'll send you a
            sign-in link.
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="submit">
            <q-input
              v-model="email"
              type="email"
              label="Email"
              autofocus
              :disable="sending"
              :rules="[
                (v) =>
                  (!!v && /.+@.+\..+/.test(v)) || 'Enter a valid email address',
              ]"
            />
            <q-btn
              class="full-width q-mt-md"
              color="primary"
              type="submit"
              label="Send sign-in link"
              :loading="sending"
            />
          </q-form>
        </q-card-section>
      </template>
      <template v-else>
        <q-card-section>
          <div class="text-h6">Check your email</div>
          <div class="text-body2 q-mt-sm">
            We've sent a sign-in link to <strong>{{ email }}</strong
            >. Click it on this device and you'll be signed in here.
          </div>
        </q-card-section>
        <q-card-actions>
          <q-btn flat label="Use a different email" @click="sent = false" />
        </q-card-actions>
      </template>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';

const $q = useQuasar();
const auth = useAuthStore();

const email = ref('');
const sending = ref(false);
const sent = ref(false);

async function submit() {
  sending.value = true;
  try {
    await auth.signInWithEmail(email.value.trim());
    sent.value = true;
  } catch (e) {
    $q.notify({
      type: 'negative',
      message:
        'Could not send the sign-in link: ' +
        (e instanceof Error ? e.message : String(e)),
    });
  } finally {
    sending.value = false;
  }
}
</script>

<style lang="scss" scoped>
.signin-card {
  width: 100%;
  max-width: 400px;
}
</style>
