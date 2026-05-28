import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomePage.vue'),
    },
    {
      path: '/ranking',
      name: 'Ranking',
      component: () => import('../views/DiscoverPage.vue'),
    },
  ],
})

export default router
