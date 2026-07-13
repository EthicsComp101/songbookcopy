<template>
  <div class="lyrics-page" v-if="song">
    <h5 class="text-h5">{{ song.name }}</h5>
    <div class="text-caption q-mb-md" v-if="song.versions.length > 1">
      {{ song.versions.length }} versions of this song
    </div>
    <SongVersion
      v-for="version in song.versions"
      :key="version.id"
      :version="version"
    />
    <div v-if="!auth.signedIn" class="text-caption q-mt-md signin-hint">
      <router-link to="/signin">Sign in</router-link> to save a version to
      your list.
    </div>
  </div>
  <div class="notice" v-else>Song not found</div>
</template>

<script setup lang="ts">
import { getSongs } from 'src/util/load-table';
import { useAuthStore } from 'src/stores/auth-store';
import SongVersion from 'src/components/SongVersion.vue';

const props = defineProps<{ song_name: string }>();

const auth = useAuthStore();

const { songs } = await getSongs();
const song = songs.find((s) => s.name === props.song_name) ?? null;
</script>

<style lang="scss" scoped>
.lyrics-page {
  padding: 12px 16px;
  max-width: 700px;

  h5 {
    margin: 0.5em 0 0.3em 0;
  }

  .signin-hint {
    opacity: 0.8;
  }
}
</style>
