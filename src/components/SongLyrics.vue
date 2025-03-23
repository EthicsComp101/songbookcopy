<template>
  <div class="lyrics" v-if="lyrics">
    <h5 class="text-h5">{{ song_name }}</h5>
    <div
      class="section"
      v-for="(section, index) in lyrics"
      :key="index"
      @click="scrollTo($event)"
    >
      {{ section }}
    </div>
  </div>
  <div class="notice" v-else>No Lyrics Available</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { Song } from './models';
import { getSongs } from 'src/util/load-table';

export default defineComponent({
  name: 'SongLyrics',
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
    const lyrics = song.lyrics?.split(/\n *\n/);
    return { song, lyrics };
  },
  methods: {
    scrollTo(event: MouseEvent) {
      const target_obj = event.target;
      if (!(target_obj instanceof Element)) return;

      target_obj.scrollIntoView({ behavior: 'smooth' });
    },
  },
});
</script>
