<template>
  <div v-if="song && (song.info || song.reference)" class="info-page">
    <h5 class="text-h5">{{ song_name }}</h5>
    <span v-if="song.info" v-html="song.info"></span>
    <p v-if="song.reference">For additional info, see <a :href="song.reference" target="_blank">here</a>.</p>
  </div>
  <div class="notice" v-else>No Info Available</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { Song } from './models';
import { getSongs } from 'src/util/table-utils';

export default defineComponent({
  name: 'SongInfo',
  props: ['song_name'],
  async setup(props) {
    const songs: Song[] = await getSongs();
    let song = null;
    for (const a_song of songs) {
      if (props.song_name == a_song.name) {
        song = a_song;
      }
    }
    if (song == null) return {};
    return { song };
  },
});
</script>
