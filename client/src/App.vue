<template>
  <div class="app-shell">
    <nav class="top-nav">
      <router-link to="/" class="nav-brand">CineSearch</router-link>
      <div class="nav-links">
        <router-link to="/" class="nav-link" :class="{ 'nav-active': route.path === '/' }">首页</router-link>
        <router-link to="/now-playing" class="nav-link" :class="{ 'nav-active': route.path === '/now-playing' }">热映</router-link>
        <router-link to="/upcoming" class="nav-link" :class="{ 'nav-active': route.path === '/upcoming' }">即将上映</router-link>
        <router-link to="/daily" class="nav-link" :class="{ 'nav-active': route.path === '/daily' }">每日推荐</router-link>
        <router-link to="/trivia" class="nav-link" :class="{ 'nav-active': route.path === '/trivia' }">电影冷知识</router-link>
        <router-link to="/ranking" class="nav-link" :class="{ 'nav-active': route.path === '/ranking' }">全部电影</router-link>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--bg-page);
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 56px;
  background: rgba(12, 12, 20, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
}

.nav-brand {
  font-size: 18px;
  font-weight: 800;
  color: var(--primary);
  text-decoration: none;
  letter-spacing: 1px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  font-size: 14px;
  color: var(--text-body);
  text-decoration: none;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 8px;
  transition: all 0.25s ease;
}

.nav-link:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.06);
}

.nav-link.nav-active {
  background: var(--primary-dim);
  color: var(--primary);
}

@media (max-width: 768px) {
  .top-nav {
    padding: 0 16px;
    height: 48px;
  }
  .nav-links { gap: 12px; }
  .nav-link { font-size: 13px; padding: 4px 10px; }
}
</style>
