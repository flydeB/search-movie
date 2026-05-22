<template>
  <footer class="app-footer">
    <p>
      <svg class="footer-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <ellipse cx="8" cy="3.5" rx="6" ry="2.3"/>
        <path d="M2 3.5v3c0 1.3 2.7 2.3 6 2.3s6-1 6-2.3v-3"/>
        <path d="M2 6.5v3c0 1.3 2.7 2.3 6 2.3s6-1 6-2.3v-3"/>
      </svg>
      数据来源：TMDB · OMDb · 豆瓣 &nbsp;|&nbsp; 仅供学习参考
    </p>
  </footer>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-footer {
  text-align: center;
  padding: 24px 20px;
  font-size: 13px;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
  letter-spacing: 0.5px;
}

.footer-icon {
  width: 14px;
  height: 14px;
  vertical-align: -2px;
  margin-right: 4px;
  opacity: 0.5;
}
</style>
