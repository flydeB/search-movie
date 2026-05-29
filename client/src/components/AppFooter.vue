<template>
  <footer class="app-footer">
    <p>
      <DatabaseOutlined class="footer-icon" />
      数据来源：TMDB · OMDb · 豆瓣 · DeepSeek &nbsp;|&nbsp; 仅供参考
    </p>
  </footer>
</template>

<script setup lang="ts">
import { DatabaseOutlined } from '@ant-design/icons-vue'
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
  font-size: 14px;
  vertical-align: -2px;
  margin-right: 4px;
  color: var(--primary);
}
</style>
