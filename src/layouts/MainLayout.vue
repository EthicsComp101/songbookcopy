<template>
  <q-layout view="lHh LpR lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="toolbar-title" @click="home"
          >The Folkbook</q-toolbar-title
        >
        <q-btn
          flat
          dense
          round
          icon="refresh"
          aria-label="Refresh"
          @click="reload()"
        />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Tools </q-item-label>
        <EssentialLink v-for="link in tools" :key="link.title" v-bind="link" />
        <q-item-label header> Helpful Links </q-item-label>
        <EssentialLink
          v-for="link in references"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive include="SongTable,TablePage">
          <Suspense> <component :is="Component" /></Suspense>
        </keep-alive>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EssentialLink from 'components/EssentialLink.vue';
import { useRouter } from 'vue-router';

const tools = [
  {
    title: 'Charts',
    caption: 'For some fun stats about the songbook',
    icon: 'bar_chart',
    to: '/charts',
  },
];
const references = [
  {
    title: 'Song Entry Form',
    caption: 'For adding new entries to this site',
    icon: 'post_add',
    link: 'https://forms.gle/o5DLQKaxBXxCxgYj7',
  },
  {
    title: 'Vaughan Williams Memorial Library',
    caption: 'For the Roud Index and access to various manuscripts',
    icon: 'library_books',
    link: 'https://archives.vwml.org/',
  },
  {
    title: 'Mainly Norfolk',
    caption: 'For details on numerous English folk records',
    icon: 'album',
    link: 'https://mainlynorfolk.info/',
  },
  {
    title: 'The Mudcat Cafe',
    caption: 'A forum of various folk personalities crowdsourcing information',
    icon: 'forum',
    link: 'https://mudcat.org/',
  },
  {
    title: 'Tobar an Dualchais',
    caption: 'Audio recordings of Scottish cultural heritage',
    icon: 'headphones',
    link: 'https://www.tobarandualchais.co.uk/',
  },
  {
    title: 'Clare Country Library',
    caption:
      'Audio recordings collected in Clare by Jim Carroll and Pat Mackenzie',
    icon: 'headphones',
    link: 'https://www.clarelibrary.ie/eolas/coclare/songs/cmc/index.htm',
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function reload() {
  location.reload();
}

const router = useRouter();

function home() {
  router.push('/');
}
</script>
