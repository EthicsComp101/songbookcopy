<template>
  <div class="details">
    <div class="song-info" v-if="song.alt.length > 0">
      <div class="label">Other Names</div>
      <div class="info-items">
        <div class="info-item" v-for="(alt, index) in song.alt" :key="index">
          {{ alt }}
        </div>
      </div>
    </div>
    <div class="song-info" v-if="song.info">
      <div class="label">Source Info</div>
      <div class="info-items source-info" v-html="info" />
    </div>
    <div class="song-info roud" v-if="song.roud && song.roud > 0">
      <div class="label">Roud</div>
      <div class="info-items">{{ song.roud }}</div>
    </div>
    <div
      style="flex-grow: 1"
      v-if="song.alt.length == 0 && !song.info && !song.roud"
    />
    <div class="song-buttons">
      <q-btn
        size="sm"
        color="accent"
        round
        dense
        :href="song.reference"
        v-if="song.reference"
        icon="info"
      />
      <q-btn
        size="sm"
        color="accent"
        round
        dense
        :to="'/lyrics/' + encodeURIComponent(song.name)"
        icon="lyrics"
        v-if="song.lyrics"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Song } from './models';
import { default as DOMPurify } from 'dompurify';
import { marked } from 'marked';
import { ref, watchEffect } from 'vue';

const { song, visible } = defineProps<{ song: Song; visible: boolean }>();

const rendered = false;

watchEffect(() => {
  if (visible && !rendered && song.info) {
    marked
      .parse(song.info, { async: true })
      .then((s) => (info.value = DOMPurify.sanitize(s)));
  }
});

const info = ref<string>('');
</script>
