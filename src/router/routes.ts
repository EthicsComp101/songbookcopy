import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('src/pages/TablePage.vue') },
      { path: 'charts', component: () => import('src/pages/ChartsPage.vue') },
    ],
  },
  {
    path: '/info/:song_name',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/InfoPage.vue'), props: true },
    ],
  },
  {
    path: '/lyrics/:song_name',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/LyricsPage.vue') }],
  },
  {
    path: '/signin',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/SignInPage.vue') }],
  },
  {
    path: '/auth/callback',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/AuthCallbackPage.vue') },
    ],
  },
  {
    path: '/profile',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/ProfilePage.vue') }],
  },
  {
    path: '/add',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/AddSongPage.vue') }],
  },
  {
    path: '/my-list',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/MyListPage.vue') }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
