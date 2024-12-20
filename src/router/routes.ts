import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('src/pages/TablePage.vue') },
    ],
  },
  {
    path: '/info/:song_name',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/InfoPage.vue') }],
  },
  {
    path: '/lyrics/:song_name',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/LyricsPage.vue') }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
