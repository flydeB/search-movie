<script setup lang="ts">
import type { MovieListItem } from '../types/movie'

defineProps<{
  movies: MovieListItem[]
  keyword: string
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'select', movie: MovieListItem): void
}>()

function handlePosterError(e: Event) {
  const img = e.target as HTMLImageElement
  if (!img.src.includes('/default-poster.png')) {
    img.src = '/default-poster.png'
  }
}
</script>

<template>
  <div class="movie-list-container">
    <!-- 搜索结果统计 -->
    <div v-if="keyword && movies.length > 0" class="result-meta">
      <span class="result-label">搜索 <em>"{{ keyword }}"</em></span>
      <span class="result-count">{{ movies.length }} 部电影</span>
    </div>

    <!-- 搜索前的引导提示 -->
    <div v-if="!keyword" class="empty-guide">
      <div class="guide-visual">
        <div class="film-reel">
          <div class="reel-center"></div>
          <div class="reel-hole h1"></div>
          <div class="reel-hole h2"></div>
          <div class="reel-hole h3"></div>
          <div class="reel-hole h4"></div>
        </div>
      </div>
      <h3 class="guide-title">开始你的电影之旅</h3>
      <p class="guide-text">输入电影名称，发现精彩世界</p>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading" class="loading-state">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <p>搜索中...</p>
    </div>

    <!-- 空搜索结果 -->
    <div v-else-if="movies.length === 0" class="empty-result">
      <svg class="empty-icon" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="28" r="18" stroke="currentColor" stroke-width="2" opacity="0.3"/>
        <path d="M26 24l4 4-4 4M38 24l-4 4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
        <path d="M20 48h24" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.2"/>
      </svg>
      <p class="empty-text">未找到与"{{ keyword }}"相关的电影</p>
      <p class="empty-hint">试试更精确的关键词，或用英文搜索</p>
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
            :src="movie.poster || '/default-poster.png'"
            :alt="movie.title"
            loading="lazy"
            @error="handlePosterError"
          />
          <div class="card-overlay">
            <div class="play-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <div class="card-year-badge" v-if="movie.year">
            {{ movie.year }}
          </div>
        </div>
        <div class="card-body">
          <h4 class="card-title">{{ movie.title }}</h4>
          <div class="card-meta">
            <span v-if="movie.rating > 0" class="card-rating">
              <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                <path d="M8 1l1.76 3.56 3.94.57-2.85 2.78.67 3.93L8 10.25l-3.52 1.59.67-3.93-2.85-2.78 3.94-.57z"/>
              </svg>
              {{ movie.rating.toFixed(1) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.movie-list-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 搜索结果统计 */
.result-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  font-size: 14px;
  color: var(--text-secondary);
}

.result-label em {
  font-style: normal;
  color: var(--primary);
  font-weight: 600;
}

.result-count {
  padding: 3px 12px;
  background: var(--primary-dim);
  border-radius: 20px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 500;
}

/* 引导提示 */
.empty-guide {
  text-align: center;
  padding: 80px 20px;
}

.guide-visual {
  margin-bottom: 28px;
}

.film-reel {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: 50%;
  border: 3px solid rgba(232, 183, 74, 0.3);
  animation: reel-spin 8s linear infinite;
}

.reel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  background: rgba(232, 183, 74, 0.2);
  border: 2px solid rgba(232, 183, 74, 0.3);
}

.reel-hole {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid rgba(232, 183, 74, 0.2);
}

.reel-hole.h1 { top: 10px; left: 50%; margin-left: -4px; }
.reel-hole.h2 { bottom: 10px; left: 50%; margin-left: -4px; }
.reel-hole.h3 { top: 50%; left: 10px; margin-top: -4px; }
.reel-hole.h4 { top: 50%; right: 10px; margin-top: -4px; }

@keyframes reel-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.guide-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.guide-text {
  font-size: 15px;
  color: var(--text-secondary);
}

/* 加载中 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0.3;
  animation: dot-bounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
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
  color: var(--text-secondary);
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
  grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
  gap: 24px;
  padding-bottom: 40px;
}

.movie-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.movie-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(232, 183, 74, 0.15);
  border-color: rgba(232, 183, 74, 0.15);
}

.card-poster {
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: var(--bg-elevated);
}

.card-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.movie-card:hover .card-poster img {
  transform: scale(1.08);
}

/* 悬浮遮罩 */
.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.movie-card:hover .card-overlay {
  opacity: 1;
}

.play-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(232, 183, 74, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(0.8);
  transition: transform 0.3s ease;
}

.movie-card:hover .play-icon {
  transform: scale(1);
}

.play-icon svg {
  width: 20px;
  height: 20px;
  color: #0c0c14;
  margin-left: 2px;
}

/* 年份徽章 */
.card-year-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 2px 10px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  border-radius: 6px;
  color: var(--text-body);
  font-size: 12px;
  font-weight: 500;
}

.card-body {
  padding: 12px 14px 16px;
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
  transition: color 0.2s;
}

.movie-card:hover .card-title {
  color: var(--primary);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-rating {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #fadb14;
  font-size: 12px;
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 768px) {
  .movie-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 14px;
  }

  .movie-list-container {
    padding: 0 16px;
  }

  .card-body {
    padding: 10px 10px 12px;
  }

  .card-title {
    font-size: 13px;
  }
}
</style>
