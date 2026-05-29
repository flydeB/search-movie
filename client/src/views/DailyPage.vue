<template>
  <div class="daily-page">
    <div class="page-header">
      <h2 class="page-title">每日推荐</h2>
      <p class="page-subtitle">每天一部经典电影，品味光影魅力</p>
    </div>

    <!-- 主推荐卡片 -->
    <div class="daily-card">
      <div class="card-visual">
        <div class="movie-icon">
          <svg viewBox="0 0 80 80" fill="none">
            <rect x="8" y="14" width="64" height="48" rx="8" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 28h64" stroke="currentColor" stroke-width="1" opacity="0.3"/>
            <circle cx="32" cy="44" r="10" stroke="currentColor" stroke-width="1.2"/>
            <path d="M44 38l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M8 52l12-8 8 6 12-8 12 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="day-badge">
          <span class="day-label">今日推荐</span>
          <span class="day-date">{{ todayStr }}</span>
        </div>
      </div>

      <div class="card-content">
        <h3 class="movie-title">{{ movie.title }}</h3>
        <div class="movie-meta">
          <span class="meta-chips">
            <span class="chip">{{ movie.year }}</span>
            <span class="chip chip-dir">{{ movie.director }}</span>
          </span>
        </div>

        <div class="section-block">
          <h4 class="section-label">
            <StarFilled class="label-icon" />
            推荐理由
          </h4>
          <p class="section-text">{{ movie.reason }}</p>
        </div>

        <div class="section-block fact-block">
          <h4 class="section-label">
            <BulbOutlined class="label-icon fact-icon" />
            幕后冷知识
          </h4>
          <p class="section-text">{{ movie.fact }}</p>
        </div>
      </div>
    </div>

    <!-- 全部推荐列表 -->
    <div class="all-section">
      <h3 class="all-title">更多经典推荐</h3>
      <div class="all-grid">
        <div
          v-for="(m, i) in allMovies"
          :key="i"
          class="all-item"
          :class="{ 'all-item-active': i === selectedIndex }"
          @click="selectMovie(i)"
        >
          <span class="all-index">{{ i + 1 }}</span>
          <div class="all-info">
            <span class="all-name">{{ m.title }}</span>
            <span class="all-meta">{{ m.year }} · {{ m.director }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { StarFilled, BulbOutlined } from '@ant-design/icons-vue'
import { getTodayMovie, DAILY_MOVIES } from '../data/movieTrivia'
import type { DailyMovie } from '../data/movieTrivia'

const movie = ref<DailyMovie>(getTodayMovie())
const allMovies = DAILY_MOVIES
const selectedIndex = ref(-1)

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
})

function selectMovie(index: number) {
  selectedIndex.value = index
  movie.value = allMovies[index]
}
</script>

<style scoped>
.daily-page { min-height: 100vh; padding-bottom: 80px; }

.page-header { text-align: center; padding: 48px 24px 24px; }

.page-title { font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: 1px; margin-bottom: 8px; }

.page-subtitle { font-size: 14px; color: var(--text-secondary); }

/* 主推荐卡片 */
.daily-card {
  max-width: 800px; margin: 0 auto;
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 20px; overflow: hidden;
}

.card-visual {
  display: flex; align-items: center; justify-content: space-between;
  padding: 28px 32px 20px; background: linear-gradient(135deg, rgba(232, 183, 74, 0.06), rgba(232, 183, 74, 0.02));
  border-bottom: 1px solid var(--border-color);
}

.movie-icon { width: 60px; height: 60px; color: var(--primary); }

.day-badge { text-align: right; }

.day-label { display: block; font-size: 11px; color: var(--primary); font-weight: 600; letter-spacing: 2px; text-transform: uppercase; }

.day-date { font-size: 13px; color: var(--text-secondary); }

.card-content { padding: 28px 32px 32px; }

.movie-title { font-size: 26px; font-weight: 800; color: var(--text-primary); margin-bottom: 12px; }

.movie-meta { margin-bottom: 24px; }

.meta-chips { display: flex; gap: 8px; }

.chip { padding: 3px 12px; background: var(--primary-dim); border-radius: 14px; color: var(--primary); font-size: 12px; font-weight: 600; }

.chip-dir { background: rgba(120, 140, 220, 0.1); color: #8fa4e0; }

/* 区块 */
.section-block { margin-bottom: 20px; }

.section-label { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }

.label-icon { font-size: 16px; color: var(--primary); }

.fact-icon { color: #6cbe7a; }

.section-text { font-size: 14px; line-height: 1.8; color: var(--text-body); }

.fact-block { background: rgba(100, 180, 120, 0.05); border-radius: 12px; padding: 16px 20px; margin-bottom: 0; border: 1px solid rgba(100, 180, 120, 0.1); }

/* 全部推荐 */
.all-section { max-width: 800px; margin: 48px auto 0; }

.all-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; }

.all-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 10px; }

.all-item { display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; transition: border-color 0.25s, background 0.25s; }

.all-item:hover { border-color: rgba(232, 183, 74, 0.3); }

.all-item-active { border-color: var(--primary) !important; background: rgba(232, 183, 74, 0.08) !important; }

.all-item-active .all-index { background: var(--primary) !important; color: #000 !important; }

.all-index { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--primary-dim); color: var(--primary); font-size: 12px; font-weight: 700; flex-shrink: 0; transition: background 0.25s, color 0.25s; }

.all-info { display: flex; flex-direction: column; gap: 2px; }

.all-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }

.all-meta { font-size: 12px; color: var(--text-secondary); }

@media (max-width: 768px) {
  .page-header { padding: 32px 16px 16px; }
  .page-title { font-size: 22px; }
  .daily-card { margin: 0 16px; }
  .card-visual { padding: 20px 20px 16px; }
  .card-content { padding: 20px; }
  .movie-title { font-size: 22px; }
  .all-grid { grid-template-columns: 1fr; }
  .all-section { padding: 0 16px; }
}
</style>
