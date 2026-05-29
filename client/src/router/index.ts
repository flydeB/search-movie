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
      path: '/now-playing',
      name: 'NowPlaying',
      component: () => import('../views/NowPlayingPage.vue'),
    },
    {
      path: '/upcoming',
      name: 'Upcoming',
      component: () => import('../views/UpcomingPage.vue'),
    },
    {
      path: '/daily',
      name: 'Daily',
      component: () => import('../views/DailyPage.vue'),
    },
    {
      path: '/trivia',
      name: 'Trivia',
      component: () => import('../views/TriviaPage.vue'),
    },
    {
      path: '/ranking',
      name: 'Ranking',
      component: () => import('../views/DiscoverPage.vue'),
    },
  ],
})

export default router
