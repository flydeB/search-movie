<script setup lang="ts">
import type { MovieListItem } from '../types/movie'

defineProps<{
  movies: MovieListItem[]
  keyword: string
}>()

const emit = defineEmits<{
  (e: 'select', movie: MovieListItem): void
}>()
</script>

<template>
  <div class="movie-list-container">
    <!-- 搜索结果统计 -->
    <div v-if="keyword" class="result-meta">
      <span class="result-label">搜索"<em>{{ keyword }}</em>"</span>
      <span class="result-count">共找到 {{ movies.length }} 部电影</span>
    </div>

    <!-- 搜索前的引导提示 -->
    <div v-if="!keyword" class="empty-guide">
      <div class="guide-icon">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="18" width="60" height="44" rx="6" stroke="#d0d5dd" stroke-width="2" fill="#f8f9fb"/>
          <rect x="16" y="24" width="20" height="28" rx="3" fill="#e8ecf1"/>
          <rect x="40" y="24" width="24" height="3" rx="1.5" fill="#e0e4ea"/>
          <rect x="40" y="30" width="24" height="3" rx="1.5" fill="#e0e4ea"/>
          <rect x="40" y="36" width="18" height="3" rx="1.5" fill="#e0e4ea"/>
          <circle cx="26" cy="50" r="4" fill="#d0d5dd"/>
          <path d="M34 50l4 4 8-8" stroke="#d0d5dd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="guide-title">探索全球电影</h3>
      <p class="guide-text">输入电影名称，开始你的电影探索之旅</p>
      <div class="guide-hints">
        <span class="hint-tag">星际穿越</span>
        <span class="hint-tag">Inception</span>
        <span class="hint-tag">千与千寻</span>
        <span class="hint-tag">The Shawshank Redemption</span>
      </div>
    </div>

    <!-- 空搜索结果 -->
    <div v-else-if="movies.length === 0" class="empty-result">
      <div class="empty-icon">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="22" stroke="#d0d5dd" stroke-width="2" stroke-dasharray="4 4" fill="#f8f9fb"/>
          <path d="M26 28l4 4-4 4M38 28l-4 4 4 4" stroke="#d0d5dd" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="empty-text">未找到与"{{ keyword }}"相关的电影</p>
      <p class="empty-hint">请尝试其他关键词</p>
    </div>

    <!-- 电影卡片网格 -->
    <div v-else class="movie-grid">
      <div
        v-for="movie in movies"
        :key="movie.id"
        class="movie-card"
        @click="emit('select', movie)"
      >
        <div class="card-poster">
          <img
            :src="movie.poster || '/placeholder-poster.svg'"
            :alt="movie.title"
            loading="lazy"
            @error="(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }"
          />
          <div v-if="!movie.poster" class="poster-placeholder">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="8" y="6" width="32" height="36" rx="4" stroke="#d0d5dd" stroke-width="1.5"/>
              <circle cx="18" cy="18" r="4" stroke="#d0d5dd" stroke-width="1.5"/>
              <path d="M10 38l10-12 6 6 8-10 8 16" stroke="#d0d5dd" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>暂无海报</span>
          </div>
          <div class="card-rating" v-if="movie.rating > 0">
            <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
              <path d="M8 1l1.76 3.56 3.94.57-2.85 2.78.67 3.93L8 10.25l-3.52 1.59.67-3.93-2.85-2.78 3.94-.57z"/>
            </svg>
            {{ movie.rating.toFixed(1) }}
          </div>
        </div>
        <div class="card-body">
          <h4 class="card-title">{{ movie.title }}</h4>
          <span class="card-year">{{ movie.year }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.movie-list-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 搜索结果统计 */
.result-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  font-size: 14px;
  color: var(--text-secondary);
}

.result-label em {
  font-style: normal;
  color: var(--primary);
  font-weight: 600;
}

.result-count {
  padding: 2px 10px;
  background: #f0f5ff;
  border-radius: 20px;
  color: var(--primary);
  font-size: 13px;
}

/* 引导提示 */
.empty-guide {
  text-align: center;
  padding: 80px 20px;
}

.guide-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
}

.guide-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.guide-text {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 28px;
}

.guide-hints {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.hint-tag {
  padding: 6px 16px;
  background: var(--bg-card);
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: default;
  transition: all 0.2s;
}

.hint-tag:hover {
  background: #e8ecf1;
  color: var(--text-primary);
}

/* 空结果 */
.empty-result {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
}

.empty-text {
  font-size: 16px;
  color: var(--text-body);
  margin-bottom: 6px;
}

.empty-hint {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 电影卡片网格 */
.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding-bottom: 40px;
}

.movie-card {
  background: #ffffff;
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.movie-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.card-poster {
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: var(--bg-card);
}

.card-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.movie-card:hover .card-poster img {
  transform: scale(1.05);
}

.poster-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: var(--text-secondary);
  font-size: 12px;
}

.poster-placeholder svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.card-rating {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  color: #fadb14;
  font-size: 12px;
  font-weight: 600;
}

.card-body {
  padding: 12px 14px 14px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.card-year {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .movie-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 14px;
    padding: 0 4px 30px;
  }

  .movie-list-container {
    padding: 0 16px;
  }
}
</style>
