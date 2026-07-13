<template>
  <q-page class="flex justify-center q-pa-md">
    <q-card
      v-if="auth.initialized && auth.signedIn"
      flat
      bordered
      class="add-song-card q-pa-md"
    >
      <q-card-section>
        <div class="text-h6">Add a Song</div>
        <div class="text-body2 q-mt-sm">
          A song always arrives with a version attached — your words, as you
          sing them.
        </div>
      </q-card-section>
      <q-card-section>
        <q-form @submit.prevent="submit" class="q-gutter-sm">
          <div class="text-subtitle2">The song</div>
          <q-input
            v-model="title"
            label="Title *"
            :disable="saving"
            :rules="[(v) => !!v?.trim() || 'A song needs a title']"
          />
          <q-select
            v-model="altTitles"
            label="Alternate titles"
            hint="Other names this song goes by — press Enter after each"
            multiple
            use-input
            use-chips
            hide-dropdown-icon
            new-value-mode="add-unique"
            :options="[]"
            :disable="saving"
          />
          <q-input v-model="composer" label="Composer" :disable="saving" />
          <q-input
            v-model.number="roud"
            label="Roud number"
            type="number"
            hint="Leave blank if it has none — a blank is often correct"
            :disable="saving"
          />
          <q-select
            v-model="songThemes"
            label="Themes"
            multiple
            use-input
            use-chips
            new-value-mode="add-unique"
            :options="themeOptions"
            :disable="saving"
          />
          <q-select
            v-model="songCategories"
            label="Categories"
            multiple
            use-input
            use-chips
            new-value-mode="add-unique"
            :options="categoryOptions"
            :disable="saving"
          />
          <q-select
            v-model="refrain"
            label="Refrain"
            :options="['None', 'Short', 'Long']"
            :disable="saving"
          />
          <div class="row q-gutter-md">
            <q-checkbox
              v-model="unaccompanied"
              label="Sung unaccompanied"
              :disable="saving"
            />
            <q-checkbox
              v-model="accompanied"
              label="Sung accompanied"
              :disable="saving"
            />
          </div>
          <div
            v-if="!accompanied && !unaccompanied"
            class="text-negative text-caption"
          >
            Pick at least one, or the song will never show up under the
            accompaniment filters.
          </div>
          <q-input
            v-model="reference"
            label="Reference link"
            hint="A recording or writeup of the song, if there is one"
            :disable="saving"
          />

          <div class="text-subtitle2 q-mt-md">Your version</div>
          <q-input
            v-model="lyrics"
            label="Lyrics"
            type="textarea"
            autogrow
            hint="Blank line between verses"
            :disable="saving"
          />
          <q-input
            v-model="source"
            label="Source"
            hint="Where you got it — a record, a person, a book"
            :disable="saving"
          />
          <q-input
            v-model="notes"
            label="Notes"
            hint="Anything worth knowing about this version"
            :disable="saving"
          />

          <q-btn
            class="full-width q-mt-md"
            color="primary"
            type="submit"
            label="Add song"
            :loading="saving"
            :disable="!accompanied && !unaccompanied"
          />
        </q-form>
      </q-card-section>
    </q-card>
    <div
      v-else-if="auth.initialized"
      class="column items-center q-gutter-md self-center"
    >
      <div class="text-body2">You need to sign in to add a song.</div>
      <q-btn color="primary" label="Sign in" to="/signin" />
    </div>
    <q-spinner v-else size="3em" class="self-center" />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';
import { supabase } from 'src/util/supabase';
import { getSongs } from 'src/util/load-table';

const $q = useQuasar();
const auth = useAuthStore();

// Offer the existing tags so people reuse them instead of inventing
// near-duplicates; new values are still allowed.
const { themes, categories } = await getSongs();
const themeOptions = [...themes.keys()].sort();
const categoryOptions = [...categories.keys()].sort();

const title = ref('');
const altTitles = ref<string[]>([]);
const composer = ref('');
const roud = ref<number | null>(null);
const songThemes = ref<string[]>([]);
const songCategories = ref<string[]>([]);
const refrain = ref<string>('None');
const accompanied = ref(false);
const unaccompanied = ref(true);
const reference = ref('');
const lyrics = ref('');
const source = ref('');
const notes = ref('');

const saving = ref(false);

async function submit() {
  saving.value = true;
  try {
    const { error } = await supabase.rpc('add_song', {
      p_title: title.value.trim(),
      p_alt_titles: altTitles.value,
      p_roud: roud.value,
      p_composer: composer.value.trim() || null,
      p_themes: songThemes.value,
      p_categories: songCategories.value,
      p_refrain: refrain.value,
      p_accompanied: accompanied.value,
      p_unaccompanied: unaccompanied.value,
      p_reference: reference.value.trim() || null,
      p_lyrics: lyrics.value.trim() || null,
      p_notes: notes.value.trim() || null,
      p_source: source.value.trim() || null,
    });
    if (error) throw new Error(error.message);
    // Full navigation, not router.push: getSongs() caches its one-shot
    // fetch for the app's lifetime, so only a fresh page load will
    // include the song we just added (same reason the header's refresh
    // button does location.reload()).
    window.location.assign(
      '/lyrics/' + encodeURIComponent(title.value.trim()),
    );
  } catch (e) {
    $q.notify({
      type: 'negative',
      timeout: 8000,
      message:
        'The song was not saved: ' +
        (e instanceof Error ? e.message : String(e)),
    });
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.add-song-card {
  width: 100%;
  max-width: 600px;
}
</style>
