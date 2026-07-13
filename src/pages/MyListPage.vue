<template>
  <q-page class="q-pa-md">
    <div v-if="auth.initialized && auth.signedIn" class="my-list">
      <h5 class="text-h5">My List</h5>
      <template v-for="group in groups" :key="group.status">
        <div class="text-subtitle1 text-weight-medium q-mt-md">
          {{ group.title }}
        </div>
        <q-list v-if="group.entries.length > 0" bordered separator class="q-mt-sm rounded-borders">
          <q-item
            v-for="entry in group.entries"
            :key="entry.version.id"
            clickable
            :to="'/lyrics/' + encodeURIComponent(entry.song.name)"
          >
            <q-item-section>
              <q-item-label>{{ entry.song.name }}</q-item-label>
              <q-item-label caption>
                {{ entry.version.authorName ?? 'From the original catalogue'
                }}<template v-if="entry.version.source">
                  — {{ entry.version.source }}</template
                >
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-caption q-mt-sm empty-note">
          {{ group.emptyNote }}
        </div>
      </template>
    </div>
    <div
      v-else-if="auth.initialized"
      class="column items-center q-gutter-md q-mt-xl"
    >
      <div class="text-body2">Sign in to keep a list of versions to learn.</div>
      <q-btn color="primary" label="Sign in" to="/signin" />
    </div>
    <div v-else class="row justify-center q-mt-xl">
      <q-spinner size="3em" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Song, Version } from 'src/components/models';
import { getSongs } from 'src/util/load-table';
import { useAuthStore } from 'src/stores/auth-store';
import { useSavesStore, type SaveStatus } from 'src/stores/saves-store';

const auth = useAuthStore();
const saves = useSavesStore();

// version id -> its song and version, for resolving saves into list entries.
const { songs } = await getSongs();
const byVersionId = new Map<string, { song: Song; version: Version }>();
for (const song of songs) {
  for (const version of song.versions) {
    byVersionId.set(version.id, { song, version });
  }
}

function entriesFor(status: SaveStatus) {
  const entries: { song: Song; version: Version }[] = [];
  for (const [versionId, savedStatus] of saves.saves) {
    if (savedStatus !== status) continue;
    const entry = byVersionId.get(versionId);
    if (entry != null) entries.push(entry);
  }
  return entries.sort((a, b) => a.song.name.localeCompare(b.song.name));
}

const groups = computed(() => [
  {
    status: 'learning',
    title: 'Learning',
    emptyNote: 'Nothing here yet — save a version from any song page.',
    entries: entriesFor('learning'),
  },
  {
    status: 'know',
    title: 'Know it',
    emptyNote: 'Nothing here yet.',
    entries: entriesFor('know'),
  },
]);
</script>

<style lang="scss" scoped>
.my-list {
  max-width: 700px;

  h5 {
    margin: 0.2em 0;
  }

  .empty-note {
    opacity: 0.7;
  }
}
</style>
