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
        <q-toggle
          flat
          dense
          round
          color="grey"
          keep-color
          checked-icon="grid_view"
          aria-label="Display Mode"
          unchecked-icon="list"
          v-model="gridMode"
        />
        <q-btn
          flat
          dense
          round
          icon="refresh"
          aria-label="Refresh"
          @click="reload()"
        />
        <q-btn
          v-if="!auth.signedIn"
          flat
          dense
          no-caps
          label="Sign in"
          aria-label="Sign in"
          to="/signin"
        />
        <q-btn-dropdown
          v-else
          flat
          dense
          no-caps
          :label="auth.displayName ?? auth.email"
          aria-label="Account"
        >
          <q-list>
            <q-item clickable v-close-popup to="/profile">
              <q-item-section avatar>
                <q-icon name="person" />
              </q-item-section>
              <q-item-section>Profile</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="signOut">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>Sign out</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
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
      <router-view v-slot="{ Component }" :grid-mode="gridMode">
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
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';

const tools = [
  {
    title: 'Add a Song',
    caption: 'For adding new entries to this site',
    icon: 'post_add',
    to: '/add',
  },
  {
    title: 'Charts',
    caption: 'For some fun stats about the songbook',
    icon: 'bar_chart',
    to: '/charts',
  },
];
const references = [
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
const gridMode = ref(false);

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

const $q = useQuasar();
const auth = useAuthStore();

async function signOut() {
  try {
    await auth.signOut();
    await router.push('/');
  } catch (e) {
    $q.notify({
      type: 'negative',
      message:
        'Sign out failed: ' + (e instanceof Error ? e.message : String(e)),
    });
  }
}
</script>
